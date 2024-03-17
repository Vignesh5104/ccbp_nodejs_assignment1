const express = require('express')
const app = express()
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const format = require('date-fns/format')
const isMatch = require('date-fns/isMatch')

app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

const initDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Started...')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initDBandServer()

const convert = obj => {
  return {
    id: obj.id,
    todo: obj.todo,
    priority: obj.priority,
    status: obj.status,
    category: obj.category,
    dueDate: obj.due_date,
  }
}

const hasSearchProperty = req => {
  return req.search_q !== undefined
}

const hasStatusProperty = req => {
  return req.status !== undefined
}

const hasPriorityProperty = req => {
  return req.priority !== undefined
}

const hasPriorityAndStatusProperty = req => {
  return req.priority !== undefined && req.status !== undefined
}

const hasCategoryAndStatusProperty = req => {
  return req.category !== undefined && req.status !== undefined
}

const hasCategoryProperty = req => {
  return req.category !== undefined
}

const hasCategoryAndPriorityProperty = req => {
  return req.category !== undefined && req.priority !== undefined
}

//API 1
app.get('/todos/', async (request, response) => {
  let todoLists = null
  let getTodosQuery = ''
  const {search_q = '', status, priority, category} = request.query

  switch (true) {
    case hasSearchProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'`
      todoLists = await db.all(getTodosQuery)
      response.send(todoLists.map(each => convert(each)))
      break
    case hasStatusProperty(request.query):
      if (status == 'TO DO' || status == 'IN PROGRESS' || status == 'DONE') {
        getTodosQuery = `SELECT * FROM todo WHERE status = '${status}'`
        todoLists = await db.all(getTodosQuery)
        response.send(todoLists.map(each => convert(each)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case hasPriorityProperty(request.query):
      if (priority == 'HIGH' || priority == 'LOW' || priority == 'MEDIUM') {
        getTodosQuery = `SELECT * FROM todo WHERE priority = '${priority}'`
        todoLists = await db.all(getTodosQuery)
        response.send(todoLists.map(each => convert(each)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }

      break
    case hasPriorityAndStatusProperty(request.query):
      if (priority == 'HIGH' || priority == 'LOW' || priority == 'MEDIUM') {
        if (status == 'TO DO' || status == 'IN PROGRESS' || status == 'DONE') {
          getTodosQuery = `SELECT * FROM todo WHERE priority = '${priority}'`
          todoLists = await db.all(getTodosQuery)
          response.send(todoLists.map(each => convert(each)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }

      break
    case hasCategoryAndStatusProperty(request.query):
      if (category == 'WORK' || category == 'HOME' || category == 'LEARNING') {
        if (status == 'TO DO' || status == 'IN PROGRESS' || status == 'DONE') {
          getTodosQuery = `SELECT * FROM todo WHERE category = '${category}' AND status = '${status}'`
          todoLists = await db.all(getTodosQuery)
          response.send(todoLists.map(each => convert(each)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasCategoryProperty(request.query):
      if (category == 'WORK' || category == 'HOME' || category == 'LEARNING') {
        getTodosQuery = `SELECT * FROM todo WHERE category = '${category}'`
        todoLists = await db.all(getTodosQuery)
        response.send(todoLists.map(each => convert(each)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }

      break
    case hasCategoryAndPriorityProperty(request.query):
      if (category == 'WORK' || category == 'HOME' || category == 'LEARNING') {
        if (priority == 'HIGH' || priority == 'LOW' || priority == 'MEDIUM') {
          getTodosQuery = `SELECT * FROM todo WHERE category = '${category}' AND priority = '${priority}'`
          todoLists = await db.all(getTodosQuery)
          response.send(todoLists.map(each => convert(each)))
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
  }
})

//API 2
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `
    SELECT * FROM
      todo
    WHERE
      id = ${todoId};
  `
  const oneTodo = await db.get(getTodoQuery)
  response.send(convert(oneTodo))
})

//API 3
app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  const dateMatch = isMatch(date, 'yyyy-MM-dd')
  if (dateMatch === true) {
    const formattedDate = format(new Date(date), 'yyyy-MM-dd')
    const getDateTodos = `
    SELECT * FROM todo
    WHERE 
      due_date = '${formattedDate}'
  `
    const dateTodos = await db.all(getDateTodos)
    response.send(dateTodos.map(each => convert(each)))
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

//API 4
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  if (priority == 'HIGH' || priority == 'LOW' || priority == 'MEDIUM') {
    if (status == 'TO DO' || status == 'IN PROGRESS' || status == 'DONE') {
      if (category == 'WORK' || category == 'HOME' || category == 'LEARNING') {
        if (isMatch(dueDate, 'yyyy-MM-dd')) {
          const newDate = format(new Date(dueDate), 'yyyy-MM-dd')
          const postTodoQuery = `
            INSERT INTO todo(
              id,
              todo,
              priority,
              status,
              category,
              due_date
            ) VALUES (
              ${id},
              '${todo}',
              '${priority}',
              '${status}',
              '${category}',
              '${newDate}'
            );
          `

          await db.run(postTodoQuery)
          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
})

//API 5
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const requestBody = request.body
  let updateColumn = ''
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break
    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
      break
    case requestBody.category !== undefined:
      updateColumn = 'Category'
      break
    case requestBody.dueDate !== undefined:
      updateColumn = 'Due Date'
      break
  }
  const previousQuery = `SELECT * FROM todo WHERE id = ${todoId};`
  const previousTodo = await db.get(previousQuery)
  const {
    status = previousTodo.status,
    priority = previousTodo.priority,
    todo = previousTodo.todo,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = requestBody

  const formattedDate = format(new Date(dueDate), 'yyyy-MM-dd')

  const updateQuery = `UPDATE todo 
  SET
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}',
    category = '${category}',
    due_date = '${formattedDate}'
  WHERE 
    id = ${todoId};
    `

  switch (true) {
    case requestBody.status !== undefined:
      if (status == 'TO DO' || status == 'IN PROGRESS' || status == 'DONE') {
        await db.run(updateQuery)
        response.send(`${updateColumn} Updated`)
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case requestBody.priority !== undefined:
      if (priority == 'HIGH' || priority == 'LOW' || priority == 'MEDIUM') {
        await db.run(updateQuery)
        response.send(`${updateColumn} Updated`)
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case requestBody.todo !== undefined:
      await db.run(updateQuery)
      response.send(`${updateColumn} Updated`)
      break

    case requestBody.category !== undefined:
      if (category == 'WORK' || category == 'HOME' || category == 'LEARNING') {
        await db.run(updateQuery)
        response.send(`${updateColumn} Updated`)
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, 'yyyy-MM-dd')) {
        await db.run(updateQuery)
        response.send(`${updateColumn} Updated`)
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
  }
})

//API 6
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE
      id=${todoId};
  `

  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
