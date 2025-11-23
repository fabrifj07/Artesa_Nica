const User = require('../models/User');
const Store = require('../models/Store');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc    Registrar usuario
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, phone, address } = req.body;

  // Crear usuario
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'user',
    phone,
    address
  });

  // Si es vendedor, crear tienda por defecto
  if (role === 'seller') {
    await Store.create({
      name: `${name}'s Store`,
      description: `Tienda de ${name}`,
      owner: user._id,
      contact: {
        email,
        phone: phone || ''
      },
      address: address || {}
    });
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Iniciar sesión
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validar email y contraseña
  if (!email || !password) {
    return next(new ErrorResponse('Por favor ingrese un correo y contraseña', 400));
  }

  // Verificar usuario
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Credenciales inválidas', 401));
  }

  // Verificar contraseña
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Credenciales inválidas', 401));
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Cerrar sesión / Limpiar cookie
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Obtener usuario actual
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  // Si es vendedor, obtener datos de la tienda
  let store;
  if (user.role === 'seller') {
    store = await Store.findOne({ owner: user._id });
  }

  res.status(200).json({
    success: true,
    data: {
      user,
      store: store || null
    },
  });
});

// @desc    Actualizar detalles del usuario
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Actualizar contraseña
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Verificar contraseña actual
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('La contraseña actual es incorrecta', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Olvidé mi contraseña
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('No hay ningún usuario con ese correo', 404));
  }

  // Obtener token de restablecimiento
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Crear URL de restablecimiento
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `Está recibiendo este correo porque usted (o alguien más) ha solicitado restablecer la contraseña de su cuenta. Por favor haga clic en el siguiente enlace: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Restablecer contraseña',
      message,
    });

    res.status(200).json({ success: true, data: 'Correo enviado' });
  } catch (err) {
    console.error(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('No se pudo enviar el correo', 500));
  }
});

// @desc    Restablecer contraseña
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Obtener token hasheado
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse('Token inválido o expirado', 400));
  }

  // Establecer nueva contraseña
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// Obtener token del modelo, crear cookie y enviar respuesta
const sendTokenResponse = (user, statusCode, res) => {
  // Crear token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  // Si se requiere HTTPS en producción
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
};
