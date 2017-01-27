'use strict'

'use strict';

var os = require('os');
var child_process = require('child_process')
var ifaces = os.networkInterfaces();

function Init() {
for(var i=0; i<Object.keys(ifaces).length; i++) {
  var cle = Object.keys(ifaces)[i];
  for (var j=0; j<ifaces[cle].length;j++) {
    var famille = ifaces[cle][j];
    if(famille.family == "IPv4" && famille.internal == false) {
      return(famille.address);
    }
  }
}
}

console.log(Init() +':3000');
child_process.exec('explorenfc-cardemulation -t "'+ Init() +':3000"',function(error){console.log(error)})

const express = require('express');

const app = express();
const fetch     = require('node-fetch');
const moment    = require('moment');

app.set('json spaces', 2);

app.use(require('serve-static')(__dirname + '/public'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('body-parser').json());
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

function buildSchedule (nextEvent, todos) {
    let availableMin = nextEvent.moment_date.diff(moment(), 'minutes');
    console.log(availableMin);
    console.log(moment());
    console.log(nextEvent);
    if (!moment().isSame(nextEvent.moment_date, 'day')) {
        availableMin -= 5*60;
    }
    //console.log(availableMin);

    let maxTaskCount = (availableMin - 30)/20;
    console.log(maxTaskCount);

    let schedule = [{
        type: 0,
        duration: 30,
        effects: [
            {
                name: 'Ambiance musicale',
                value: 'Jazz'
            }
        ]
    }];

    return schedule.concat(
        todos.slice(0, maxTaskCount)
        .map(todo => ({
            type: 1,
            task: todo.content,
            duration: 20,
            effects: [
                {
                    name: 'Ambiance musicale',
                    value: 'Rock'
                }
            ]
        }))
    );
}

app.post('/api/schedule', (req, res, next) => {
    let limit = moment().endOf('day').add(1, 'day');

    let todos = req.body.todos;
    let events = req.body.events;

    todos = todos.map(todo => {
        if (todo.due_date_utc) {
            todo.moment_date = moment(todo.due_date_utc);
            todo.days_late = - todo.moment_date.diff(limit, 'days');
            todo.weight = (todo.priority) * (todo.days_late + 1);
        } else {
            todo.weight = (todo.priority);
        }
        return todo;
    })
    .filter(todo => {
        return !todo.due_date_utc || moment(todo.due_date_utc).isBefore(limit);
    })
    .sort((a,b) => b.weight-a.weight);

    events = events.map(event => {
        event.moment_date = moment(event.startDate);
        return event;
    })
    .sort((a,b) => a.moment_date.diff(b.moment_date));

    let nextEvent = events.filter(event => moment().isBefore(event.moment_date))[0];

    res.json({
        schedule: buildSchedule(nextEvent, todos)
    });

});

app.listen(3000);
