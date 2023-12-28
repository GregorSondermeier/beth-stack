import { Elysia, t } from 'elysia';
import { html } from '@elysiajs/html';
import * as elements from 'typed-html';

const app = new Elysia()
  .use(html())
  .get('/', ({ html }) => html(
    <BaseHtml>
      <body
        class="flex w-full h-screen justify-center items-center"
        hx-get="/todos"
        hx-trigger="load"
        hx-swap="innerHTML"
      />
    </BaseHtml>)
  )
  .post('/clicked', () => <div class="text-blue-600">I'm from the server!</div>)
  .get('/todos', () => <TodoList todos={db} />)
  .post(
    '/todos/:id/toggle',
    ({ params }) => {
      const todo = db.find((todo) => todo.id === params.id)

      if (!todo) {
        return;
      }

      todo.completed = !todo.completed;
      return <TodoItem { ... todo} />
    },
    {
      params: t.Object({
        id: t.Numeric()
      })
    })
  .delete(
    '/todos/:id',
    ({ params }) => {
      const todo = db.find((todo) => todo.id === params.id)

      if (!todo) {
        return;
      }

      db.splice(db.indexOf(todo), 1);
    },
    {
      params: t.Object({
        id: t.Numeric()
      })
    })
  .post(
    '/todos',
    ({ body }) => {
      if (!body.content?.length) {
        throw new Error('content cannot be empty');
      }

      const newTodo: Todo = {
        id: lastID++,
        content: body.content,
        completed: false,
      }

      db.push(newTodo);

      return <TodoItem { ...newTodo } />
    },
    {
      body: t.Object({
        content: t.String()
      })
    })
  .listen(3000);

console.log(`Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);

const BaseHtml = ({ children }: elements.Children) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-with, initial-scale=1.0">
  <title>THE BETH STACK</title>
  <script src="https://unpkg.com/htmx.org@1.9.10"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/hyperscript.org@0.9.12"></script>
</head>

${children}

</html>
`;

type Todo = {
  id: number;
  content: string;
  completed: boolean;
};

const db: Todo[] = [
  { id: 1, content: 'learn the beth stack', completed: true },
  { id: 2, content: 'learn vim', completed: false },
];
let lastID = db.at(-1)!.id;

function TodoItem({ id, content, completed }: Todo) {
  return (
    <div class="flex flex-row space-x-3">
      <p>{content}</p>
      <input
        type="checkbox"
        checked={completed}
        hx-post={`/todos/${id}/toggle`}
        hx-target="closest div"
        hx-swap="outerHTML"
      />
      <button
        class="text-red-500"
        hx-delete={`/todos/${id}`}
        hx-swap="outerHTML"
        hx-target="closest div"
      >X</button>
    </div>
  );
}

function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <div>
      {todos.map((todo) => (
        <TodoItem {...todo} />
      ))}
      <TodoForm />
    </div>
  );
}

function TodoForm() {
  return (
    <form
      class="flex flex-row space-x-3"
      hx-post="/todos"
      hx-swap="beforebegin"
      _="on submit target.reset()"
    >
      <input
        type="text"
        name="content"
        class="border border-black"
      />
      <button type="submit">Add</button>
    </form>
  );
}