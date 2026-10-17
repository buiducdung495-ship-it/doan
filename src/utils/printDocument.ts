import { User } from '../types';

export const printDocument = (docTitle: string, docContentHtml: string, user: User) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const signatureHtml = user.signatureUrl 
    ? `<img src="${user.signatureUrl}" alt="Signature" style="max-height: 80px; margin-top: 10px;" />` 
    : `<div style="height: 80px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; color: #999; margin-top: 10px; width: 200px;">Chưa có chữ ký</div>`;

  printWindow.document.write(`
    <html>
      <head>
        <title>In - ${docTitle}</title>
        <style>
          body { 
            font-family: 'Times New Roman', serif; 
            padding: 40px; 
            color: #000; 
            line-height: 1.5; 
            position: relative;
          }
          body::before {
            content: 'TÀI LIỆU LƯU HÀNH NỘI BỘ - EVN';
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 80px;
            color: rgba(0, 0, 0, 0.05);
            white-space: nowrap;
            pointer-events: none;
            z-index: -1;
          }
          .header { text-align: center; margin-bottom: 40px; }
          .content { margin-bottom: 50px; }
          .footer { display: flex; justify-content: flex-end; margin-top: 50px; }
          .signature-box { text-align: center; width: 300px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2 style="margin: 0; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h2>
          <h3 style="margin: 5px 0 0 0;">Độc lập - Tự do - Hạnh phúc</h3>
          <hr style="width: 30%; border: 1px solid #000; margin: 15px auto;" />
        </div>
        
        <div class="content">
          <h1 style="text-align: center; text-transform: uppercase;">${docTitle}</h1>
          ${docContentHtml}
        </div>
        
        <div class="footer">
          <div class="signature-box">
            <p>Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</p>
            <p><strong>Người ký</strong></p>
            ${signatureHtml}
            <p style="margin-top: 10px;"><strong>${user.name}</strong></p>
          </div>
        </div>
        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
