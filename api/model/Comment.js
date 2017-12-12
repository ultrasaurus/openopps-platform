module.exports = {
  validateComment: async (attributes) => {
    var obj = {};
    obj['invalidAttributes'] = {};
    obj = validateComment(obj, attributes);
    return obj;
  },
};

function validateComment (obj, attributes) {
  if (attributes.value.match(/[<>]/g)) {
    obj['invalidAttributes']['comment'] = [];
    obj['invalidAttributes']['comment'].push({'message': 'Comment must not contain the special characters < or >.'});
  }
  return obj;
}
