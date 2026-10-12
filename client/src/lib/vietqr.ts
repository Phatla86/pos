export function generateVietQRUrl({
  bankId,
  accountNo,
  accountName,
  amount,
  orderCode,
  template = 'compact2',
}: {
  bankId: string;
  accountNo: string;
  accountName: string;
  amount: number;
  orderCode: string;
  template?: string;
}): string {
  const cleanBank = encodeURIComponent(bankId.trim());
  const cleanAcc = encodeURIComponent(accountNo.trim().replace(/\s+/g, ''));
  const cleanName = encodeURIComponent(accountName.trim());
  const cleanDesc = encodeURIComponent(`Thanh toan don ${orderCode}`);

  return `https://img.vietqr.io/image/${cleanBank}-${cleanAcc}-${template}.png?amount=${Math.round(amount)}&addInfo=${cleanDesc}&accountName=${cleanName}`;
}

export function formatVND(amount: number): string {
  return (amount || 0).toLocaleString('vi-VN') + ' đ';
}
