

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ error: 'Not authenticated. Please login.' });
};

const isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Admin access required.' });
};

const requireTeacher = (req, res, next) => {
  if (req.session && req.session.user && (req.session.user.role === 'teacher' || req.session.user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({ error: 'Teacher access required.' });
};

module.exports = { isAuthenticated, isAdmin, requireTeacher };
