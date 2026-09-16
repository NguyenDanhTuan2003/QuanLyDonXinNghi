export enum ApprovalMessagePattern {
  SEND_APPROVAL = 'approval.user.response',
  CANCEL_APPROVAL = 'approval.cancel',
}

export const SEND_APPROVAL_MESSAGE = ApprovalMessagePattern.SEND_APPROVAL;
export const CANCEL_APPROVAL_MESSAGE = ApprovalMessagePattern.CANCEL_APPROVAL;
