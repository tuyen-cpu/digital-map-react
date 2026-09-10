# Migration notes — v1.5

## Quản trị & báo cáo
- Báo cáo không còn là một trang riêng trong giao diện; chuyển thành tab `Báo cáo Excel` ngay trong `/admin`.
- Giữ redirect `/admin/bao-cao -> /admin` để link cũ không bị lỗi.
- Admin có danh sách tài khoản đã đăng ký, chỉnh sửa tài khoản và phân quyền theo Danh mục / Phân nhóm / Phân nhóm chi tiết.
- Thêm vai trò `manager`; manager chỉ CRUD địa điểm đúng phạm vi được cấp.
- Admin có thể đổi tên đăng nhập, tên hiển thị, số điện thoại, vai trò và phạm vi quyền của user.
- Reset mật khẩu user về `PhuongBinhDinh@123` và đánh dấu `mustChangePassword`; App bắt buộc chuyển sang `/doi-mat-khau` sau lần đăng nhập kế tiếp.

## Ảnh 360°
- Thay viewer kéo ảnh phẳng bằng `@photo-sphere-viewer/core`.
- Panorama equirectangular được chiếu lên hình cầu, hỗ trợ xoay 360°, nhìn lên/xuống, zoom, chuột/cảm ứng và fullscreen.
- Nếu địa điểm chưa có ảnh panorama chuẩn, giao diện hiển thị thông báo thay vì giả lập ảnh thường thành ảnh 360°.

## Đánh giá & phản hồi
- Review có `replies[]`.
- Admin, manager và user đã đăng nhập có thể phản hồi đánh giá.
- Người tạo phản hồi hoặc Admin có thể xóa phản hồi; Admin vẫn có thể xóa toàn bộ đánh giá.

## Tài khoản cá nhân
- Upload/thay avatar từ máy qua IndexedDB.
- Đổi mật khẩu trong `/doi-mat-khau`.
- Lưu lịch sử theo tài khoản khi xem chi tiết, dẫn đường hoặc đánh dấu đã đến.
- Có lịch nhắc theo địa điểm trong lịch sử và Notification khi website đang mở/trình duyệt cho phép.
- Có bản đồ cá nhân hiển thị các địa điểm trong lịch sử có tọa độ; nơi đã đến có marker dấu ✓.

## Điều hướng
- Đăng xuất từ Header chỉ xóa session, không ép navigate về Trang chủ; URL/trang hiện tại được giữ nguyên.

## Dữ liệu ảnh
- Tăng số ảnh minh họa mặc định và gallery theo loại địa điểm để giảm lặp ảnh.
- Ảnh mặc định vẫn là ảnh minh họa khi chưa có ảnh riêng chính xác của cơ sở; Admin có thể thay trực tiếp bằng upload từ máy.

## Storage mới
- `binh-dinh:users-v2`
- `binh-dinh:locations-v5`
- `binh-dinh:reviews-v2`
- `binh-dinh:travel-history-v1`
- `binh-dinh:travel-reminders-v1`

Dữ liệu cũ được migrate khi có thể. Đây vẫn là bản chạy độc lập bằng localStorage/IndexedDB; production đa thiết bị cần backend dùng chung.
