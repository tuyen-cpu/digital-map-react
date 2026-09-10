# Media audit — Phường Bình Định

Ngày rà media nội bộ: 08/09/2026.

## Nguyên tắc

- Đã rà trạng thái media cho **toàn bộ 170 địa điểm trong một lượt**.
- Chỉ gán ảnh khi ảnh công khai có thể đối chiếu với **đúng tên/cơ sở/địa điểm**.
- Không lấy ảnh chung theo danh mục (chùa, karaoke, quán ăn, đường phố...) để lấp chỗ trống.
- Không dùng một URL ảnh cho hai địa điểm khác nhau.
- Nếu chưa xác minh được ảnh đúng, trường `image` để `null` và giao diện hiển thị trạng thái chưa có ảnh.
- Registry ảnh đã xác minh nằm ở `src/data/verifiedMedia.json`; script import Excel chỉ đọc registry này, không tự sinh ảnh minh họa.

## Kết quả hiện tại

- 170/170 địa điểm đã được đánh dấu trạng thái rà media.
- 20 địa điểm có ảnh công khai đã xác minh và được gắn vào dữ liệu.
- 150 địa điểm chưa có ảnh đủ chắc chắn nên chủ động để trống.

Các địa điểm có ảnh xác minh hiện tại gồm: Cột cờ thành Bình Định xưa; Địa điểm nhà thầy Trương Văn Hiến; Chùa Nhơn Từ; Làng nghề bún khô - bánh tráng An Thái; Nhà Thờ Giáo Xứ Kim Châu; Phố Chợ An Nhơn; Khách sạn Century; NiNa Hotel; REX HOTEL AN NHON; Doong Cha; H.E.M Coffee & Tea; Ốc Chảo An Nhơn; Trà Sữa Gấu; Billiards NT Bình Định; Công viên nước An Nhơn; Công viên phố chợ An Nhơn; Quảng trường Trung Tâm phường Bình Định; Chợ An Nhơn; Co.opmart An Nhơn; Trường THPT Số 1 An Nhơn.

> Lưu ý: việc ảnh xuất hiện công khai trên web không đồng nghĩa với quyền tái phân phối. Dự án đang tham chiếu URL công khai; trước khi vận hành thương mại nên kiểm tra điều khoản/giấy phép của từng nguồn hoặc thay bằng ảnh do đơn vị tự sở hữu.
