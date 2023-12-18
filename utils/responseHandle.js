const { response } = require("express");

const responseData = function (response, statusCode, values,status) {
  var data = {
    status: status,
    data: values,
  };
  response.status(statusCode, values).json(data);
  response.end;
};

const responseWithPagination = function (response, statusCode, values,paginate, status) {
  var data = {
    status: status,
    data: values,
    pagination:paginate
  };
  response.status(statusCode, values).json(data);
  response.end;
};

const responseMessage = function (response, statusCode, message,isError) {
  var data = {
    error: isError,
    message: message,
  };
  response.status(statusCode).json(data);
  response.end;
};

const internalError = function (response) {
  var data = {
    status: 500,
    message: "internal server error",
  };
  response.status(500).json(data);
  response.end;
};
module.exports = {
  responseData,
  responseMessage,
  internalError,
  responseWithPagination
};
