const _ = require('lodash');
var dao = require('postgres-gen-dao');

const userQuery = "select @m_user.id, @m_user.name, @m_user.title, @location.name, @agency.name " +
"from @midas_user m_user " +
"left outer join tagentity_users__user_tags user_tag on user_tag.user_tags = m_user.id " +
"left outer join @tagentity location on location.id = user_tag.tagentity_users and location.type = 'location' " +
"left outer join @tagentity agency on agency.id = user_tag.tagentity_users and agency.type = 'agency' ";


const options = {
    user: {
     fetch: {
       location: '',
       agency: ''
     }
   }
 };

 const clean = {
    Users: function(records) {
        return records.map(function(record) {
            var cleaned = _.pickBy(record, _.identity);
            cleaned.location = _.pickBy(cleaned.location);
            cleaned.agency = _.pickBy(cleaned.agency);
            return cleaned;
        });        
    }
  }

 module.exports = function(db) {
    return {
      User: dao({ db: db, table: 'midas_user' }),
      TagEntity: dao({ db: db, table: 'tagentity' }),
      query: {
        user: userQuery
      },
      options: options,
      clean: clean
    };
  };