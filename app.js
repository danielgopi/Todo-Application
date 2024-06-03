const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const isValid = require("date-fns/isValid");
const format = require("date-fns/format");

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasDueDateProperty = (requestQuery) => {
  return requestQuery.dueDate !== undefined;
};

const isValidTodoPriority = (item) => {
  if (item === "HIGH" || item === "MEDIUM" || item === "LOW") {
    return true;
  } else {
    return false;
  }
};

const isValidTodoStatus = (item) => {
  if (item === "TO DO" || item === "IN PROGRESS" || item === "DONE") {
    return true;
  } else {
    return false;
  }
};

const isValidTodoCategory = (item) => {
  if (item === "WORK" || item === "HOME" || item === "LEARNING") {
    return true;
  } else {
    return false;
  }
};

const isValidTodoDueDate = (item) => {
  return isValid(new Date(item));
};

const convertTodoDbToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let data = null;

  let getTodoQuery = "";
  const { search_q = "", status, priority, category } = request.query;
  switch (true) {
    case hasStatusProperty(request.query):
      getTodoQuery = `
            SELECT * 
            FROM todo 
            WHERE todo LIKE '%${search_q}%'
            AND status ='${status}';
            `;
      if (isValidTodoStatus(status)) {
        data = await db.all(getTodoQuery);
        response.send(
          data.map((eachData) => convertTodoDbToResponseObject(eachData))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `
            SELECT * 
            FROM todo 
            WHERE todo LIKE '%${search_q}%'
            AND priority = '${priority}';
            `;
      if (isValidTodoPriority(priority)) {
        data = await db.all(getTodoQuery);
        response.send(
          data.map((eachData) => convertTodoDbToResponseObject(eachData))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategoryProperty(request.query):
      getTodoQuery = `
            SELECT * 
            FROM todo 
            WHERE todo LIKE '%${search_q}%'
            AND category = '${category}';
            `;
      if (isValidTodoCategory(category)) {
        data = await db.all(getTodoQuery);
        response.send(
          data.map((eachData) => convertTodoDbToResponseObject(eachData))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasPriorityAndStatus(request.query):
      getTodoQuery = `
            SELECT * 
            FROM todo 
            WHERE todo LIKE '%${search_q}%'
            AND priority = '${priority}'
            AND status ='${status}';
            `;
      if (isValidTodoPriority(priority) && isValidTodoStatus(status)) {
        data = await db.all(getTodoQuery);
        response.send(
          data.map((eachData) => convertTodoDbToResponseObject(eachData))
        );
      } else if (isValidTodoPriority(priority)) {
        response.status(400);
        response.send("Invalid Todo Status");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategoryAndStatus(request.query):
      getTodoQuery = `
            SELECT * 
            FROM todo 
            WHERE todo LIKE '%${search_q}%'
            AND category = '${category}'
            AND status ='${status}';
            `;
      if (isValidTodoCategory(category) && isValidTodoStatus(status)) {
        data = await db.all(getTodoQuery);
        response.send(
          data.map((eachData) => convertTodoDbToResponseObject(eachData))
        );
      } else if (isValidTodoStatus(status)) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasCategoryAndPriority(request.query):
      getTodoQuery = `
            SELECT * 
            FROM todo 
            WHERE todo LIKE '%${search_q}%'
            AND category = '${category}'
            AND priority ='${priority}';
            `;
      if (isValidTodoCategory(category) && isValidTodoPriority(priority)) {
        data = await db.all(getTodoQuery);
        response.send(
          data.map((eachData) => convertTodoDbToResponseObject(eachData))
        );
      } else if (isValidTodoPriority(priority)) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    default:
      getTodoQuery = `
            SELECT * 
            FROM todo 
            WHERE todo LIKE '%${search_q}%';`;
      data = await db.all(getTodoQuery);
      response.send(
        data.map((eachData) => convertTodoDbToResponseObject(eachData))
      );
  }
});

//Get Specific Todo Based on ID
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT * FROM 
    todo WHERE id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(convertTodoDbToResponseObject(todo));
});

//Get All Todo IDs based on Query
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (date === undefined) {
    response.status(400);
    response.send("Invalid Due Date");
  } else if (isValidTodoDueDate(date)) {
    const formattedDate = format(new Date(date), "yyyy-MM-dd");
    const getTodoQuery = `
      SELECT * 
      FROM todo 
      WHERE due_date = '${formattedDate}';
      `;
    const todoQuery = await db.all(getTodoQuery);
    response.send(
      todoQuery.map((eachTodo) => convertTodoDbToResponseObject(eachTodo))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//Create a Todo Query
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  switch (false) {
    case isValidTodoPriority(priority):
      response.status(400);
      response.send("Invalid Todo Priority");
      break;
    case isValidTodoStatus(status):
      response.status(400);
      response.send("Invalid Todo Status");
      break;
    case isValidTodoCategory(category):
      response.status(400);
      response.send("Invalid Todo Category");
      break;
    case isValidTodoDueDate(dueDate):
      response.status(400);
      response.send("Invalid Due Date");
      break;
    default:
      const formattedDate = format(new Date(dueDate), "yyyy-MM-dd");
      const createTodoQuery = `
    INSERT INTO 
    todo(id, todo, priority, status, category, due_date) 
    VALUES(
        ${id},
        '${todo}',
        '${priority}',
        '${status}',
        '${category}',
       '${formattedDate}'

    );
    `;
      await db.run(createTodoQuery);
      response.send("Todo Successfully Added");
      break;
  }
});

//Update Specific Todo Based on ID
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { todo, priority, status, category, dueDate } = request.body;
  switch (true) {
    case hasStatusProperty(request.body):
      const updateStatusTodoQuery = `
            UPDATE todo 
            SET status ='${status}'
            WHERE id = ${todoId};
            `;
      if (isValidTodoStatus(status)) {
        await db.run(updateStatusTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasCategoryProperty(request.body):
      const updateCategoryTodoQuery = `
            UPDATE todo 
            SET category ='${category}'
            WHERE id = ${todoId};
            `;
      if (isValidTodoCategory(category)) {
        await db.run(updateCategoryTodoQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasPriorityProperty(request.body):
      const updatePriorityTodoQuery = `
            UPDATE todo 
            SET priority ='${priority}'
            WHERE id = ${todoId};
            `;
      if (isValidTodoPriority(priority)) {
        await db.run(updatePriorityTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasDueDateProperty(request.body):
      const updateDueDatePriorityTodoQuery = `
            UPDATE todo 
            SET due_date ='${dueDate}'
            WHERE id = ${todoId};
            `;
      if (isValidTodoDueDate(dueDate)) {
        await db.run(updateDueDatePriorityTodoQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
    default:
      const updateTodoQuery = `
            UPDATE todo 
            SET todo ='${todo}'
            WHERE id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
  }
});

//Delete Todo from Todo table Based on ID
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE FROM 
    todo WHERE id = ${todoId};
    `;

  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
