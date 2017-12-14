const _ = require('lodash');
const DateCodeGenerator = require('./dateCodeGenerator');

function VolunteerAgencyMetrics (volunteers, agencyPeople, tasks, group) {
  this.volunteers = volunteers;
  this.agencyPeople = agencyPeople;
  this.tasks = tasks;
  this.codeGenerator = new DateCodeGenerator(group);
  this.metrics = {};
}

_.extend(VolunteerAgencyMetrics.prototype, {
  calculate: function (done) {
    this.done = done;
    this.findVolunteers();
  },

  findVolunteers: function () {
    this.processVolunteers();
  },

  processVolunteers: function () {
    this.groupVolunteers();
    this.findAgencyPeople();
  },

  groupVolunteers: function () {
    var codeGenerator = this.codeGenerator;
    this.groupedVolunteer = _.groupBy(this.volunteers, function (volunteer) {
      return codeGenerator.create(volunteer.createdAt);
    });

    var volunteerMetrics = _.reduce(this.groupedVolunteer, function (o, vols, fy) {
      o[fy] = vols.length;
      return o;
    }, {});

    this.metrics.volunteers = volunteerMetrics;
  },

  findAgencyPeople: function () {
    this.handleAgencyTaggedUsers(this.agencyPeople);
  },

  handleAgencyTaggedUsers: function (users) {
    var agencyMetrics = _.reduce(this.groupedVolunteer, function (o, vols, fy) {
      o[fy] = _.chain(vols).map(function (vol) {
        var volUser = _.find(users, { id: vol.userId });
        if (!volUser || !volUser.tags || !volUser.tags[0]) return undefined;
        return (volUser.tags[0] || {}).id;
      }).compact().uniq().value().length;

      return o;
    }, {});

    this.metrics.agencies = agencyMetrics;
    this.done();
  },
});

module.exports = VolunteerAgencyMetrics;