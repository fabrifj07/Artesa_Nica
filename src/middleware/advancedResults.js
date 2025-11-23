const advancedResults = (model, populate) => async (req, res, next) => {
  // Copiar el objeto de consulta
  const reqQuery = { ...req.query };

  // Campos a excluir
  const removeFields = ['select', 'sort', 'page', 'limit', 'search'];

  // Eliminar campos de la consulta
  removeFields.forEach((param) => delete reqQuery[param]);

  // Crear cadena de consulta
  let queryStr = JSON.stringify(reqQuery);

  // Crear operadores ($gt, $gte, etc.)
  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );

  // Construir consulta inicial
  let query = model.find(JSON.parse(queryStr));

  // Búsqueda de texto completo si está habilitado en el modelo
  if (req.query.search && model.schema.paths.$text) {
    query = query.find({ $text: { $search: req.query.search } });
  }

  // Seleccionar campos específicos
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Ordenar
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Paginación
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments(JSON.parse(queryStr));

  query = query.skip(startIndex).limit(limit);

  // Población (populate)
  if (populate) {
    if (Array.isArray(populate)) {
      populate.forEach((field) => {
        query = query.populate(field);
      });
    } else {
      query = query.populate(populate);
    }
  }

  // Ejecutar consulta
  const results = await query;

  // Resultados de la paginación
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results,
  };

  next();
};

module.exports = advancedResults;
