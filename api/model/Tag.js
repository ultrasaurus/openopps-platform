const tagTypes = [
  'task-people', 
  'skill',
  'task-length',
  'location',
  'task-time-estimate',
  'agency',
  'task-time-required',
  'task-skills-required',
  'topic',
];

module.exports = {
  IsValidTagType: function (type) {
    if (tagTypes.indexOf(type) == -1) {
      return false;
    }
    return true;
  },
};