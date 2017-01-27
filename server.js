'use strict'

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

    if (moment().isSame(nextEvent.moment_date, 'day')) {
        availableMin -= 5*60;
    }

    let maxTaskCount = (availableMin - 30)/todos.length;

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

    let { todos, events } = req.body;

    todos = todos.map(todo => {
        if (todo.due_date_utc) {
            todo.moment_date = moment(todo.due_date_utc);
            todo.days_late = - todo.moment_date.diff(limit, 'days');
            todo.weight = (4-todo.priority) * (todo.days_late + 1);
        } else {
            todo.weight = (4-todo.priority);
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
