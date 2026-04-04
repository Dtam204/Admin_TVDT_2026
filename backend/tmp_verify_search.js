const { pool } = require('./src/config/database');
const PublicationService = require('./src/services/admin/publication.service');

async function testSearch() {
  console.log('--- TEST SEARCH API LOGIC ---');
  try {
    // Test tìm kiếm với dải năm và sắp xếp mặc định
    const results = await PublicationService.getAll({
      year_from: 2005,
      year_to: 2026,
      sort_by: 'default'
    });
    
    console.log('Số lượng kết quả:', results.publications.length);
    if (results.publications.length > 0) {
      console.log('Ấn phẩm đầu tiên (Theo lượt xem & A-Z):');
      console.log('- Tiêu đề:', results.publications[0].title);
      console.log('- Lượt xem:', results.publications[0].view_count);
      console.log('- Năm:', results.publications[0].publication_year);
    } else {
      console.log('Không có dữ liệu để hiển thị, nhưng logic đã thông suốt.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi test:', error.message);
    process.exit(1);
  }
}

testSearch();
