Bản vá v6 - click thông báo đánh giá + Trang chủ là route chính

1) Chép đè toàn bộ thư mục src trong ZIP vào thư mục gốc dự án.
2) Trang / bây giờ là Trang chủ.
3) /trang-chu tự chuyển về /.
4) Bản đồ du lịch chuyển sang /ban-do-du-lich.
5) Các link dẫn đường cũ đã đổi sang /ban-do-du-lich?routeTo=...
6) Admin/Manager bấm thông báo đánh giá sẽ mở đúng trang địa điểm, tự cuộn đến đúng đánh giá và tự mở ô phản hồi.
7) Trong tab Đánh giá của quản trị cũng có nút mở đúng trang địa điểm để phản hồi.

Sau khi chép đè:
  npm run dev

Nếu deploy Netlify:
  npm run build
  deploy lại thư mục dist.
