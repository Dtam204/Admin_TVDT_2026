const DEFAULT_APP_ID = 'admin-thuvien-backend';

const sendApiResponse = (
  res,
  {
    status = 200,
    success,
    message = '',
    data = null,
    errors = null,
    errorId = null,
    appId = DEFAULT_APP_ID,
  } = {},
) => {
  const isSuccess = typeof success === 'boolean' ? success : status >= 200 && status < 300;

  return res.status(status).json({
    code: status,
    errorId,
    appId,
    success: isSuccess,
    message,
    data,
    errors,
  });
};

module.exports = {
  sendApiResponse,
  DEFAULT_APP_ID,
};
