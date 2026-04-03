const { pool } = require('./src/config/database');
const newsController = require('./src/controllers/news.controller');

async function testNews() {
  console.log('📰 Testing News Creation and Retrieval...');
  try {
    // 1. Get current news
    const reqGet = { query: {} };
    const resGet = { json: (data) => console.log('✅ Current News Count:', data.data.length) };
    await newsController.getNews(reqGet, resGet, (err) => { if (err) throw err; });

    // 2. Try creating a news item
    const testNews = {
      title: { vi: 'Tiêu đề thử nghiệm 2026', en: 'Test Title 2026' },
      summary: 'Tóm tắt nội dung thử nghiệm.',
      content: 'Nội dung chi tiết của bài viết thử nghiệm hệ thống.',
      status: 'published',
      imageUrl: 'https://example.com/image.jpg',
      author: 'Admin',
      readTime: '5 mins',
      slug: 'test-news-' + Date.now(),
      isFeatured: true
    };

    const reqPost = { body: testNews };
    const resPost = { 
        status: (code) => ({ json: (data) => console.log('✅ Created News ID:', data.data.id) })
    };
    
    await newsController.createNews(reqPost, resPost, (err) => { if (err) throw err; });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

testNews();
