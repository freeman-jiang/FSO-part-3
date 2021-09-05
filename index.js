require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')

morgan.token('body', req => JSON.stringify(req.body))

const app = express()

app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms :body')
)
app.use(cors())
app.use(express.static('build'))

app.use(express.json())

const Person = require('./models/person')

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

// GET ALL persons
app.get('/api/persons', (request, response) => {
  Person.find({}).then(people => {
    response.json(people)
  })
})

// GET person BY ID
app.get('/api/persons/:id', (request, response, next) => {
  const id = request.params.id
  Person.findById(id)
    .then(res => {
      if (res) {
        response.json(res)
      } else {
        response.status(404).end()
      }
    })
    .catch(err => {
      next(err)
    })
})

// GET info
app.get('/info', (request, response) => {
  const dateNow = new Date()
  Person.count().then(res => {
    response.send(
      `
        <p>Phonebook has info for ${res} people</p>
        <p>${dateNow}</p>
      `
    )
  })
})

// DELETE person BY ID
app.delete('/api/persons/:id', (request, response, next) => {
  const id = request.params.id
  Person.findByIdAndRemove(id)
    .then(res => {
      response.status(204).end()
      console.log(res)
    })
    .catch(err => next(err))
})

// ADD person
app.post('/api/persons', (request, response, next) => {
  const person = new Person(request.body)
  if (!person.name || !person.number) {
    response.status(400).end()
    return
  }

  person
    .save()
    .then(res => {
      response.json(res)
    })
    .catch(err => next(err))
})

app.put('/api/persons/:id', (request, response, next) => {
  const person = request.body
  if (!person.name || !person.number) {
    response.status(400).end()
    return
  }
  Person.findByIdAndUpdate(person.id, person, {
    new: true,
    runValidators: true,
    context: 'query',
  })
    .then(updatedPerson => response.json(updatedPerson))
    .catch(err => next(err))
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.log(error.name)
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  }

  if (error.name === 'ValidationError') {
    return response.status(409).send({ error: error.message })
  }

  // if (error.name === )

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
