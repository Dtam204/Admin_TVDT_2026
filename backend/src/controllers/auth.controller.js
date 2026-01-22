const { auth } = require('../services/admin');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email và mật khẩu là bắt buộc',
      });
    }

    const result = await auth.authenticateAdmin({ email, password });

    if (result) {
      return res.json({
        success: true,
        ...result,
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Email hoặc mật khẩu không đúng hoặc tài khoản bị khoá',
    });
  } catch (error) {
    console.error('Login error:', error);
    return next(error);
  }
};

