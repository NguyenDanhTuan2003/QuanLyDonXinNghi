import {
  Repository,
  FindOptionsWhere,
  FindOptionsOrder,
  FindOptionsSelect,
  FindOptionsRelations,
  ObjectLiteral,
} from 'typeorm';

/**
 * TỔNG QUAN CẤU TRÚC FILE:
 * Bước 1. CÁC HẰNG SỐ BẢO MẬT & GIỚI HẠN: Chứa các cấu hình an toàn (độ sâu tối đa, độ dài mảng, danh sách key bị chặn) để chống injection qua payload.
 * Bước 2. CÁC HÀM HELPER XỬ LÝ DỮ LIỆU & TYPE GUARDS: Các hàm hỗ trợ (kiểm tra Object, ép kiểu Date an toàn, và hàm processWhereObject lọc bỏ dữ liệu độc hại).
 * Bước 3. INTERFACE CHO PAYLOAD: Định nghĩa schema (TypeormQueryPayload) cho các options query truyền vào (where, page, limit, sort, select, relations).
 * Bước 4. HÀM CHÍNH (typeormUniversalGet): Hàm trực tiếp gọi vào DB, nhận query payload, làm sạch dữ liệu, ráp với defaultOptions và trả về kết quả an toàn.
 */

// ============================================================================
// 1. CÁC HẰNG SỐ BẢO MẬT & GIỚI HẠN
// ============================================================================
const MAX_DEPTH = 8;
const MAX_ARRAY_LENGTH = 100;

/**
 * Các key bị chặn tuyệt đối để ngăn prototype pollution.
 * Các key bắt đầu bằng '$' cũng bị chặn (operator của MongoDB, không có ý nghĩa trong TypeORM).
 */
const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

// ============================================================================
// 2. CÁC HÀM HELPER XỬ LÝ DỮ LIỆU & TYPE GUARDS
// ============================================================================

/** Kiểm tra có phải plain object hay không (loại trừ null, Array, Date...) */
const isPlainObject = (obj: unknown): obj is Record<string, unknown> => {
  return Object.prototype.toString.call(obj) === '[object Object]';
};

/**
 * Ép chuỗi ISO Date thành object Date một cách an toàn.
 * Biểu thức chính quy kiểm tra định dạng ISO Date:
 * - ^\d{4}-\d{2}-\d{2}: Bắt buộc phần ngày tháng năm theo định dạng YYYY-MM-DD
 * - (T\d{2}:\d{2}:\d{2}: (Tùy chọn) Bắt đầu bằng chữ 'T', theo sau là giờ:phút:giây (HH:mm:ss)
 * - (\.\d+)?: (Tùy chọn) Phần thập phân của giây (milli-giây...), ví dụ: .123
 * - (Z|[+-]\d{2}:\d{2})?)?: (Tùy chọn) Ký hiệu múi giờ, 'Z' (UTC) hoặc bù giờ '+07:00'
 */
const parseDateSafe = (value: unknown): unknown => {
  const isoDateRegex =
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
  if (typeof value === 'string' && isoDateRegex.test(value)) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) return date;
  }
  return value;
};

interface StackItem {
  source: Record<string, unknown> | unknown[];
  target: Record<string, unknown> | unknown[];
  depth: number;
}

/**
 * Duyệt đệ quy (dùng stack, không dùng đệ quy thật để tránh stack overflow)
 * qua object where mà client gửi lên, lọc bỏ các key nguy hiểm
 * (__proto__, constructor, prototype) và các key bắt đầu bằng '$'.
 */
const processWhereObject = (queryObj: unknown): Record<string, unknown> => {
  if (!isPlainObject(queryObj)) return {};

  const result: Record<string, unknown> = {};
  const stack: StackItem[] = [{ source: queryObj, target: result, depth: 0 }];

  while (stack.length > 0) {
    const currentTask = stack.pop();
    if (!currentTask) continue;

    const { source, target, depth } = currentTask;

    if (depth > MAX_DEPTH) {
      throw new Error('Nesting too deep');
    }

    if (Array.isArray(source) && Array.isArray(target)) {
      if (source.length > MAX_ARRAY_LENGTH) {
        throw new Error('Array too large');
      }
      for (let i = 0; i < source.length; i++) {
        const value = source[i];
        if (isPlainObject(value)) {
          const newTarget: Record<string, unknown> = {};
          target[i] = newTarget;
          stack.push({ source: value, target: newTarget, depth: depth + 1 });
        } else if (Array.isArray(value)) {
          const newTarget: unknown[] = [];
          target[i] = newTarget;
          stack.push({ source: value, target: newTarget, depth: depth + 1 });
        } else {
          target[i] = parseDateSafe(value);
        }
      }
    } else if (isPlainObject(source) && isPlainObject(target)) {
      for (const [key, value] of Object.entries(source)) {
        // Chặn prototype pollution và MongoDB-style operators
        if (BLOCKED_KEYS.has(key) || key.startsWith('$')) continue;

        if (isPlainObject(value)) {
          const newTarget: Record<string, unknown> = {};
          target[key] = newTarget;
          stack.push({ source: value, target: newTarget, depth: depth + 1 });
        } else if (Array.isArray(value)) {
          const newTarget: unknown[] = [];
          target[key] = newTarget;
          stack.push({ source: value, target: newTarget, depth: depth + 1 });
        } else {
          target[key] = parseDateSafe(value);
        }
      }
    }
  }

  return result;
};

/**
 * Lọc danh sách relations mà client gửi lên.
 * Chỉ cho phép các string thuần (chỉ chứa chữ, số, dấu gạch dưới và dấu chấm).
 */
const sanitizeRelations = (relations: unknown): string[] => {
  if (!Array.isArray(relations)) return [];
  const safe: string[] = [];
  for (const rel of relations) {
    if (typeof rel === 'string' && /^[a-zA-Z0-9_.]+$/.test(rel)) {
      safe.push(rel);
    }
  }
  return safe;
};

/**
 * Lọc danh sách select fields mà client gửi lên.
 * Chỉ cho phép các string thuần (chỉ chứa chữ, số, dấu gạch dưới và dấu chấm).
 */
const sanitizeSelect = (select: unknown): string[] => {
  if (!Array.isArray(select)) return [];
  const safe: string[] = [];
  for (const field of select) {
    if (typeof field === 'string' && /^[a-zA-Z0-9_.]+$/.test(field)) {
      safe.push(field);
    }
  }
  return safe;
};

// ============================================================================
// 3. INTERFACE CHO PAYLOAD
// ============================================================================

/**
 * Sort direction tương tự Mongo nhưng cho TypeORM.
 * TypeORM chấp nhận: 'ASC' | 'DESC' | 'asc' | 'desc' | 1 | -1
 */
export type TypeormSortDirection = 'ASC' | 'DESC' | 'asc' | 'desc' | 1 | -1;

export interface TypeormQueryPayload {
  /** Điều kiện lọc — tương đương FindOptionsWhere trong TypeORM */
  where?: Record<string, unknown>;
  /** Trang hiện tại (bắt đầu từ 1) */
  page?: number;
  /** Số bản ghi mỗi trang */
  limit?: number;
  /**
   * Sắp xếp kết quả.
   * Ví dụ: { "createdAt": "DESC" } hoặc { "createdAt": -1 }
   */
  sort?: Record<string, TypeormSortDirection>;
  /**
   * Danh sách các cột cần lấy.
   * Ví dụ: ["id", "name", "email"]
   */
  select?: string[];
  /**
   * Danh sách các relation cần join.
   * Ví dụ: ["user", "department.manager"]
   */
  relations?: string[];
}

// ============================================================================
// 4. HÀM CHÍNH (GỌI TẠI CONTROLLER VÀ SERVICE)
// ============================================================================

/** Chuyển sort direction từ dạng Mongo (-1/1) và string sang TypeORM ('ASC'/'DESC'). */
const normalizeDirection = (dir: TypeormSortDirection): 'ASC' | 'DESC' => {
  if (dir === 1 || dir === 'asc' || dir === 'ASC') return 'ASC';
  return 'DESC';
};

/** Build FindOptionsOrder<T> từ payload sort object. */
const buildOrder = <T extends ObjectLiteral>(
  sort: Record<string, TypeormSortDirection>,
): FindOptionsOrder<T> => {
  const order: Record<string, 'ASC' | 'DESC'> = {};
  for (const [key, dir] of Object.entries(sort)) {
    // Chỉ cho phép key hợp lệ
    if (/^[a-zA-Z0-9_.]+$/.test(key)) {
      order[key] = normalizeDirection(dir);
    }
  }
  return order as FindOptionsOrder<T>;
};

/**
 * Build FindOptionsSelect<T> từ mảng string cột cần lấy.
 * TypeORM chấp nhận object { field: true } làm select.
 */
const buildSelect = <T extends ObjectLiteral>(
  fields: string[],
): FindOptionsSelect<T> => {
  const select: Record<string, boolean> = {};
  for (const field of fields) {
    select[field] = true;
  }
  return select as FindOptionsSelect<T>;
};

/**
 * Build FindOptionsRelations<T> từ mảng string relation.
 * Hỗ trợ nested relation 1 cấp: 'department.manager' → { department: { manager: true } }
 */
const buildRelations = <T extends ObjectLiteral>(
  relations: string[],
): FindOptionsRelations<T> => {
  const result: Record<string, boolean | Record<string, boolean>> = {};
  for (const rel of relations) {
    const parts = rel.split('.');
    if (parts.length === 1) {
      result[parts[0]] = true;
    } else {
      // Nested relation (chỉ hỗ trợ 1 cấp sâu)
      if (!result[parts[0]] || typeof result[parts[0]] === 'boolean') {
        result[parts[0]] = {};
      }
      (result[parts[0]] as Record<string, boolean>)[parts[1]] = true;
    }
  }
  return result as FindOptionsRelations<T>;
};

/**
 * Hàm universal query cho TypeORM — tương đương mongoUniversalGet cho Mongoose.
 *
 * @param repository     Repository<T> của entity cần query
 * @param payload        Payload từ client (string JSON hoặc plain object)
 * @param defaultOptions Options mặc định (where, page, limit, sort, select, relations)
 * @returns              Mảng entity tìm được, hoặc [] nếu có lỗi
 *
 * @example
 * // Trong service:
 * return typeormUniversalGet(this.userRepository, queryPayload, {
 *   where: { isActive: true },
 *   sort: { createdAt: 'DESC' },
 * });
 */
export async function typeormUniversalGet<T extends ObjectLiteral>(
  repository: Repository<T>,
  payload?: string | Record<string, unknown>,
  defaultOptions?: Partial<TypeormQueryPayload>,
): Promise<T[]> {
  try {
    // --- Khởi tạo giá trị từ defaultOptions (dùng Record để tránh unresolvable generic types) ---
    let whereRaw: Record<string, unknown> = defaultOptions?.where ?? {};
    let page = defaultOptions?.page ?? 1;
    let limit = defaultOptions?.limit ?? 20;
    let sortRaw: Record<string, 'ASC' | 'DESC'> = defaultOptions?.sort
      ? (buildOrder(defaultOptions.sort) as Record<string, 'ASC' | 'DESC'>)
      : { id: 'DESC' };
    let selectFields: string[] = sanitizeSelect(defaultOptions?.select ?? []);
    let relationsList: string[] = sanitizeRelations(
      defaultOptions?.relations ?? [],
    );

    // --- Parse và merge payload từ client ---
    if (payload) {
      let parsed: unknown;

      if (typeof payload === 'string') {
        parsed = JSON.parse(payload) as unknown;
      } else if (isPlainObject(payload)) {
        parsed = payload;
      }

      if (!isPlainObject(parsed)) return [];

      const parsedPayload = parsed as TypeormQueryPayload;

      // Merge where: client where được làm sạch trước, defaultOptions.where ghi đè lên sau
      if (parsedPayload.where && isPlainObject(parsedPayload.where)) {
        const feWhere = processWhereObject(parsedPayload.where);
        whereRaw = { ...feWhere, ...(defaultOptions?.where ?? {}) };
      }

      if (parsedPayload.page) page = Number(parsedPayload.page) || page;
      if (parsedPayload.limit) limit = Number(parsedPayload.limit) || limit;

      if (parsedPayload.sort && isPlainObject(parsedPayload.sort)) {
        sortRaw = buildOrder(parsedPayload.sort) as Record<
          string,
          'ASC' | 'DESC'
        >;
      }

      if (parsedPayload.select) {
        const safe = sanitizeSelect(parsedPayload.select);
        if (safe.length > 0) selectFields = safe;
      }

      if (parsedPayload.relations) {
        const safe = sanitizeRelations(parsedPayload.relations);
        if (safe.length > 0) relationsList = safe;
      }
    }

    const skip = (page - 1) * limit;

    const whereArg = whereRaw as FindOptionsWhere<T>;
    const orderArg = sortRaw as FindOptionsOrder<T>;

    const findOptions = {
      where: whereArg,
      order: orderArg,
      skip,
      take: limit,
      ...(selectFields.length > 0
        ? { select: buildSelect<T>(selectFields) }
        : {}),
      ...(relationsList.length > 0
        ? { relations: buildRelations<T>(relationsList) }
        : {}),
    };

    const result = await repository.find(findOptions);
    return result ?? [];
  } catch {
    return [];
  }
}
