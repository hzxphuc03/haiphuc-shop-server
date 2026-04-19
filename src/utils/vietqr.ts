/**
 * VietQR Generation Utility
 * Đại ca sử dụng dịch vụ của VietQR.io (miễn phí) để tạo ảnh QR
 * Tài liệu: https://vietqr.io/hướng-dẫn/api-tạo-mã-qr-thanh-toán/
 */

interface BankInfo {
  bankId: string;      // Ví dụ: 'MB', 'VCB', 'ICB' (Vietinbank), 'TCB' (Techcombank)
  accountNumber: string;
  accountName: string;
}

/**
 * Hàm tạo URL ảnh QR Code thanh toán VietQR
 * @param amount Số tiền cần thanh toán (tiền cọc)
 * @param orderId Mã đơn hàng
 * @param bankInfo Thông tin tài khoản của đại ca
 * @returns {string} URL ảnh QR code
 */
export const generateVietQRUrl = (
  amount: number,
  orderId: string,
  bankInfo: BankInfo
): string => {
  const { bankId, accountNumber, accountName } = bankInfo;

  // Định dạng nội dung chuyển khoản theo yêu cầu: H4IPHUNC [orderId]
  const addInfo = `H4IPHUNC ${orderId}`;

  // Encode các tham số để đảm bảo URL hợp lệ
  const encodedDescription = encodeURIComponent(addInfo);
  const encodedAccountName = encodeURIComponent(accountName);

  /**
   * Cấu trúc URL VietQR.io:
   * https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NUMBER>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<DESCRIPTION>&accountName=<ACCOUNT_NAME>
   * 
   * Các Template phổ biến:
   * - compact: QR kèm thông tin số tài khoản & tên (khuyên dùng)
   * - qr_only: Chỉ có mã QR
   * - print: Bản in khổ dọc có đầy đủ thông tin
   */
  const template = 'compact';

  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNumber}-${template}.png?amount=${amount}&addInfo=${encodedDescription}&accountName=${encodedAccountName}`;

  return qrUrl;
};

/**
 * Ví dụ cách dùng:
 * 
 * const url = generateVietQRUrl(1500000, 'OD12345', {
 *   bankId: 'MB',
 *   accountNumber: '999999999999',
 *   accountName: 'PHAM HAI PHUC'
 * });
 * 
 * console.log(url);
 */
