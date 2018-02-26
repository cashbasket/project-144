
var moment = require('moment');
var momentTz = require('moment-timezone');
var jstz = require('jstimezonedetect');

function hbsHelpers(hbs) {
	return hbs.create({
		helpers: {
			formatDate: function(datetime, format) {      
				var momentDatetime = moment(datetime);
				var tz = jstz.determine().name();
				var tzTime = momentDatetime.tz(tz);
  
				return tzTime.format(format);
			},
			groupedEach: function(every, context, options) {
				var out = '', subcontext = [], i;
				if (context && context.length > 0) {
					for (i = 0; i < context.length; i++) {
						if (i > 0 && i % every === 0) {
							out += options.fn(subcontext);
							subcontext = [];
						}
						subcontext.push(context[i]);
					}
					out += options.fn(subcontext);
				}
				return out;
			},
			ifEquals: function(arg1, arg2, options) {
				return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
			}
		},
		defaultLayout: 'main'
	});
}

module.exports = hbsHelpers;