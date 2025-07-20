const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'LinkedIn Scraper is running! 🚀' });
});

// Main scraping endpoint
app.post('/scrape', async (req, res) => {
  console.log('🔥 New scraping request received!');
  
  try {
    const { profileUrl, cookie } = req.body;
    
    // Validate inputs
    if (!profileUrl || !cookie) {
      return res.status(400).json({ 
        error: 'Missing profileUrl or cookie',
        success: false 
      });
    }
    
    console.log('🎯 Target URL:', profileUrl);
    
    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set realistic user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    // Set the LinkedIn session cookie
    await page.setCookie({
      name: 'li_at',
      value: cookie.includes('li_at=') ? cookie.split('li_at=')[1].split(';')[0] : cookie,
      domain: '.linkedin.com',
      httpOnly: true,
      secure: true,
      sameSite: 'None'
    });
    
    console.log('🍪 Cookie set successfully');
    
    // Navigate to profile
    await page.goto(profileUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('📄 Page loaded, waiting for content...');
    
    // Wait and scroll to load dynamic content
    await page.waitForTimeout(3000);
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight);
    });
    await page.waitForTimeout(2000);
    
    // Get the full HTML
    const html = await page.content();
    
    await browser.close();
    
    console.log('✅ Scraping completed successfully!');
    console.log('📊 HTML length:', html.length);
    
    // Return the HTML (same format as your current workflow expects)
    res.json({
      success: true,
      body: html,
      data: html,
      profileUrl: profileUrl,
      htmlLength: html.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Scraping error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 LinkedIn Scraper running on port ${PORT}`);
});