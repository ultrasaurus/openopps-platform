module.exports = {
  validatePassword: function (password, username) {
    var notUsername = password.toLowerCase().trim() !== username.split('@',1)[0].toLowerCase().trim();
    var minLength = password.length >= 8;
    var lowercase = /[a-z]/.test(password);
    var uppercase = /[A-Z]/.test(password);
    var number = /[0-9]/.test(password);
    var symbol = /[^\w\s]/.test(password);
    return (notUsername && minLength && lowercase && uppercase && number && symbol);
  },
};
