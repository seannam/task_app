import request from 'supertest';
import { expect } from 'chai';
import {
  buildTask,
  buildProject,
  buildUser,
  createTask,
  createProject,
  createUser,
} from './factories';
import { startDatabase } from './utils';
import { Task, Project, User } from 'data/models';
import { app } from 'server/app';
import { server } from 'server/index';

const ENDPOINT = '/task';

describe('Task tests', () => {
  beforeEach(async () => {
    await startDatabase();
  });

  afterAll(async () => {
    await server.close();
  });

  it('Should respond with a new created task', async () => {
    const relProjectDict = await buildProject({});
    const relFakeProject = await createProject(relProjectDict);
    const relCreatorDict = await buildUser({});
    const relFakeCreator = await createUser(relCreatorDict);
    const relAssignedPrimaryDict = await buildUser({});
    const relFakeAssignedPrimary = await createUser(relAssignedPrimaryDict);
    const relAssignedSecondaryDict = await buildUser({});
    const relFakeAssignedSecondary = await createUser(relAssignedSecondaryDict);
    const relParentTaskDict = await buildTask({});
    const relFakeParentTask = await createTask(relParentTaskDict);

    const fakeTask = await buildTask({
      project: relFakeProject.projectName,
      creator: relFakeCreator.id,
      assignedPrimary: relFakeAssignedPrimary.id,
      assignedSecondary: relFakeAssignedSecondary.id,
      parentTask: relFakeParentTask.id,
    });

    const response = await request(app).post(ENDPOINT).send(fakeTask);

    expect(response.status).to.equal(201);
    expect(response.statusCode).to.equal(201);

    const responseTask = response.body.data;

    const task = await Task.findByPk(responseTask.id);

    expect(task.title).to.equal(fakeTask.title);
    expect(task.body).to.equal(fakeTask.body);
    expect(task.dueDate).to.equal(fakeTask.dueDate);
    expect(task.status).to.equal(fakeTask.status);
    expect(task.creation.toJSON()).to.eql(fakeTask.creation);
    expect(task.priority).to.equal(fakeTask.priority);
    expect(task.storyPoint).to.equal(fakeTask.storyPoint);

    expect(task.project).to.equal(fakeTask.project);
    expect(task.creator).to.equal(fakeTask.creator);
    expect(task.assignedPrimary).to.equal(fakeTask.assignedPrimary);
    expect(task.assignedSecondary).to.equal(fakeTask.assignedSecondary);
    expect(task.parentTask).to.equal(fakeTask.parentTask);
  });

  it('Should not create task if project does not exist', async () => {
    const fakeTask = await buildTask({});
    const project = await Project.findOne({
      where: { projectName: fakeTask.project },
    });
    await project.destroy();

    const response = await request(app).post(ENDPOINT).send(fakeTask);

    const { statusCode } = response;
    expect(statusCode).to.equal(404);
  });

  it('Should not create task if creator does not exist', async () => {
    const fakeTask = await buildTask({});
    const creator = await User.findOne({ where: { id: fakeTask.creator } });
    await creator.destroy();

    const response = await request(app).post(ENDPOINT).send(fakeTask);

    const { statusCode } = response;
    expect(statusCode).to.equal(404);
  });

  it('Should not create task if assignedPrimary does not exist', async () => {
    const fakeTask = await buildTask({});
    const assignedPrimary = await User.findOne({
      where: { id: fakeTask.assignedPrimary },
    });
    await assignedPrimary.destroy();

    const response = await request(app).post(ENDPOINT).send(fakeTask);

    const { statusCode } = response;
    expect(statusCode).to.equal(404);
  });

  it('Should not create task if assignedSecondary does not exist', async () => {
    const relAssignedSecondaryDict = await buildUser({});
    const relFakeAssignedSecondary = await createUser(relAssignedSecondaryDict);

    const id = relFakeAssignedSecondary.id;
    await relFakeAssignedSecondary.destroy();

    const fakeTask = await buildTask({ assignedSecondary: id });

    const response = await request(app).post(ENDPOINT).send(fakeTask);

    expect(response.statusCode).to.equal(404);
  });

  it('Should not create task if parentTask does not exist', async () => {
    const relParentTaskDict = await buildTask({});
    const relFakeParentTask = await createTask(relParentTaskDict);

    const id = relFakeParentTask.id;
    await relFakeParentTask.destroy();

    const fakeTask = await buildTask({ parentTask: id });

    const response = await request(app).post(ENDPOINT).send(fakeTask);

    expect(response.statusCode).to.equal(404);
  });

  it('Should respond with a task', async () => {
    const relProjectDict = await buildProject({});
    const relFakeProject = await createProject(relProjectDict);
    const relCreatorDict = await buildUser({});
    const relFakeCreator = await createUser(relCreatorDict);
    const relAssignedPrimaryDict = await buildUser({});
    const relFakeAssignedPrimary = await createUser(relAssignedPrimaryDict);
    const relAssignedSecondaryDict = await buildUser({});
    const relFakeAssignedSecondary = await createUser(relAssignedSecondaryDict);
    const relParentTaskDict = await buildTask({});
    const relFakeParentTask = await createTask(relParentTaskDict);

    const taskDict = await buildTask({
      project: relFakeProject.projectName,
      creator: relFakeCreator.id,
      assignedPrimary: relFakeAssignedPrimary.id,
      assignedSecondary: relFakeAssignedSecondary.id,
      parentTask: relFakeParentTask.id,
    });
    const fakeTask = await createTask(taskDict);

    const response = await request(app).get(`${ENDPOINT}/${fakeTask.id}`);

    const { statusCode, status } = response;
    const { data } = response.body;

    expect(status).to.equal(200);
    expect(statusCode).to.equal(200);

    expect(data.id).to.equal(fakeTask.id);
    expect(data.title).to.equal(fakeTask.title);
    expect(data.body).to.equal(fakeTask.body);
    expect(data.dueDate).to.equal(fakeTask.dueDate);
    expect(data.status).to.equal(fakeTask.status);
    expect(data.creation).to.equal(fakeTask.creation.toJSON());
    expect(data.priority).to.equal(fakeTask.priority);
    expect(data.storyPoint).to.equal(fakeTask.storyPoint);

    expect(data.subtasks).to.eql([]);
    expect(data.project).to.equal(fakeTask.project);
    expect(data.creator).to.equal(fakeTask.creator);
    expect(data.assignedPrimary).to.equal(fakeTask.assignedPrimary);
    expect(data.assignedSecondary).to.equal(fakeTask.assignedSecondary);
    expect(data.parentTask).to.equal(fakeTask.parentTask);
  });
  it('Should throw an error if task was not found', async () => {
    const taskDict = await buildTask({});
    const fakeTask = await createTask(taskDict);
    const { id } = fakeTask;
    await fakeTask.destroy();

    const response = await request(app).get(`${ENDPOINT}/${id}`);
    const { statusCode } = response;
    expect(statusCode).to.equal(404);
  });
  it('Should respond with a list of tasks', async () => {
    const response = await request(app).get(ENDPOINT);

    const { statusCode, status } = response;
    const { data } = response.body;

    expect(status).to.equal(200);
    expect(statusCode).to.equal(200);

    const allTask = await Task.findAll();
    expect(data.length).to.equal(allTask.length);
  });
  it('Should respond with an updated task', async () => {
    const relProjectDict = await buildProject({});
    const relFakeProject = await createProject(relProjectDict);
    const relCreatorDict = await buildUser({});
    const relFakeCreator = await createUser(relCreatorDict);
    const relAssignedPrimaryDict = await buildUser({});
    const relFakeAssignedPrimary = await createUser(relAssignedPrimaryDict);
    const relAssignedSecondaryDict = await buildUser({});
    const relFakeAssignedSecondary = await createUser(relAssignedSecondaryDict);
    const relParentTaskDict = await buildTask({});
    const relFakeParentTask = await createTask(relParentTaskDict);

    const taskDict = await buildTask({
      project: relFakeProject.projectName,
      creator: relFakeCreator.id,
      assignedPrimary: relFakeAssignedPrimary.id,
      assignedSecondary: relFakeAssignedSecondary.id,
      parentTask: relFakeParentTask.id,
    });
    const fakeTask = await createTask(taskDict);

    const anotherProjectDict = await buildProject({});
    const anotherrelFakeProject = await createProject(anotherProjectDict);
    const anotherCreatorDict = await buildUser({});
    const anotherrelFakeCreator = await createUser(anotherCreatorDict);
    const anotherAssignedPrimaryDict = await buildUser({});
    const anotherrelFakeAssignedPrimary = await createUser(
      anotherAssignedPrimaryDict
    );
    const anotherAssignedSecondaryDict = await buildUser({});
    const anotherrelFakeAssignedSecondary = await createUser(
      anotherAssignedSecondaryDict
    );
    const anotherParentTaskDict = await buildTask({});
    const anotherrelFakeParentTask = await createTask(anotherParentTaskDict);

    const anotherFakeTask = await buildTask({
      project: anotherrelFakeProject.projectName,
      creator: anotherrelFakeCreator.id,
      assignedPrimary: anotherrelFakeAssignedPrimary.id,
      assignedSecondary: anotherrelFakeAssignedSecondary.id,
      parentTask: anotherrelFakeParentTask.id,
    });

    const response = await request(app).put(`${ENDPOINT}/${fakeTask.id}`).send({
      title: anotherFakeTask.title,
      body: anotherFakeTask.body,
      dueDate: anotherFakeTask.dueDate,
      status: anotherFakeTask.status,
      creation: anotherFakeTask.creation,
      priority: anotherFakeTask.priority,
      storyPoint: anotherFakeTask.storyPoint,
      project: anotherFakeTask.project,
      creator: anotherFakeTask.creator,
      assignedPrimary: anotherFakeTask.assignedPrimary,
      assignedSecondary: anotherFakeTask.assignedSecondary,
      parentTask: anotherFakeTask.parentTask,
    });

    const { status } = response;
    const { data } = response.body;

    expect(status).to.equal(200);
    expect(response.statusCode).to.equal(200);

    expect(data.title).to.equal(anotherFakeTask.title);
    expect(data.body).to.equal(anotherFakeTask.body);
    expect(data.dueDate).to.equal(anotherFakeTask.dueDate);
    expect(data.status).to.equal(anotherFakeTask.status);
    expect(data.creation).to.equal(anotherFakeTask.creation);
    expect(data.priority).to.equal(anotherFakeTask.priority);
    expect(data.storyPoint).to.equal(anotherFakeTask.storyPoint);
    expect(data.project).to.equal(anotherFakeTask.project);
    expect(data.creator).to.equal(anotherFakeTask.creator);
    expect(data.assignedPrimary).to.equal(anotherFakeTask.assignedPrimary);
    expect(data.assignedSecondary).to.equal(anotherFakeTask.assignedSecondary);
    expect(data.parentTask).to.equal(anotherFakeTask.parentTask);

    const updatedTask = await Task.findByPk(fakeTask.id);

    expect(updatedTask.title).to.equal(anotherFakeTask.title);
    expect(updatedTask.body).to.equal(anotherFakeTask.body);
    expect(updatedTask.dueDate).to.equal(anotherFakeTask.dueDate);
    expect(updatedTask.status).to.equal(anotherFakeTask.status);
    expect(updatedTask.creation.toJSON()).to.eql(anotherFakeTask.creation);
    expect(updatedTask.priority).to.equal(anotherFakeTask.priority);
    expect(updatedTask.storyPoint).to.equal(anotherFakeTask.storyPoint);

    expect(updatedTask.project).to.equal(anotherFakeTask.project);
    expect(updatedTask.creator).to.equal(anotherFakeTask.creator);
    expect(updatedTask.assignedPrimary).to.equal(
      anotherFakeTask.assignedPrimary
    );
    expect(updatedTask.assignedSecondary).to.equal(
      anotherFakeTask.assignedSecondary
    );
    expect(updatedTask.parentTask).to.equal(anotherFakeTask.parentTask);
  });

  it('Should not update task, if project does not exist', async () => {
    const relProjectDict = await buildProject({});
    const relFakeProject = await createProject(relProjectDict);
    const relCreatorDict = await buildUser({});
    const relFakeCreator = await createUser(relCreatorDict);
    const relAssignedPrimaryDict = await buildUser({});
    const relFakeAssignedPrimary = await createUser(relAssignedPrimaryDict);
    const relAssignedSecondaryDict = await buildUser({});
    const relFakeAssignedSecondary = await createUser(relAssignedSecondaryDict);
    const relParentTaskDict = await buildTask({});
    const relFakeParentTask = await createTask(relParentTaskDict);

    const taskDict = await buildTask({
      project: relFakeProject.projectName,
      creator: relFakeCreator.id,
      assignedPrimary: relFakeAssignedPrimary.id,
      assignedSecondary: relFakeAssignedSecondary.id,
      parentTask: relFakeParentTask.id,
    });
    const fakeTask = await createTask(taskDict);

    const anotherProjectDict = await buildProject({});
    const anotherrelFakeProject = await createProject(anotherProjectDict);

    taskDict.project = anotherrelFakeProject.projectName;

    await anotherrelFakeProject.destroy();

    const response = await request(app).put(`${ENDPOINT}/${fakeTask.id}`).send({
      title: taskDict.title,
      body: taskDict.body,
      dueDate: taskDict.dueDate,
      status: taskDict.status,
      creation: taskDict.creation,
      priority: taskDict.priority,
      storyPoint: taskDict.storyPoint,
      project: taskDict.project,
      creator: taskDict.creator,
      assignedPrimary: taskDict.assignedPrimary,
      assignedSecondary: taskDict.assignedSecondary,
      parentTask: taskDict.parentTask,
    });

    const { statusCode } = response;
    expect(statusCode).to.equal(404);
  });
  it('Should not update task, if creator does not exist', async () => {
    const relProjectDict = await buildProject({});
    const relFakeProject = await createProject(relProjectDict);
    const relCreatorDict = await buildUser({});
    const relFakeCreator = await createUser(relCreatorDict);
    const relAssignedPrimaryDict = await buildUser({});
    const relFakeAssignedPrimary = await createUser(relAssignedPrimaryDict);
    const relAssignedSecondaryDict = await buildUser({});
    const relFakeAssignedSecondary = await createUser(relAssignedSecondaryDict);
    const relParentTaskDict = await buildTask({});
    const relFakeParentTask = await createTask(relParentTaskDict);

    const taskDict = await buildTask({
      project: relFakeProject.projectName,
      creator: relFakeCreator.id,
      assignedPrimary: relFakeAssignedPrimary.id,
      assignedSecondary: relFakeAssignedSecondary.id,
      parentTask: relFakeParentTask.id,
    });
    const fakeTask = await createTask(taskDict);

    const anotherCreatorDict = await buildUser({});
    const anotherrelFakeCreator = await createUser(anotherCreatorDict);

    taskDict.creator = anotherrelFakeCreator.id;

    await anotherrelFakeCreator.destroy();

    const response = await request(app).put(`${ENDPOINT}/${fakeTask.id}`).send({
      title: taskDict.title,
      body: taskDict.body,
      dueDate: taskDict.dueDate,
      status: taskDict.status,
      creation: taskDict.creation,
      priority: taskDict.priority,
      storyPoint: taskDict.storyPoint,
      project: taskDict.project,
      creator: taskDict.creator,
      assignedPrimary: taskDict.assignedPrimary,
      assignedSecondary: taskDict.assignedSecondary,
      parentTask: taskDict.parentTask,
    });

    const { statusCode } = response;
    expect(statusCode).to.equal(404);
  });
  it('Should not update task, if assignedPrimary does not exist', async () => {
    const relProjectDict = await buildProject({});
    const relFakeProject = await createProject(relProjectDict);
    const relCreatorDict = await buildUser({});
    const relFakeCreator = await createUser(relCreatorDict);
    const relAssignedPrimaryDict = await buildUser({});
    const relFakeAssignedPrimary = await createUser(relAssignedPrimaryDict);
    const relAssignedSecondaryDict = await buildUser({});
    const relFakeAssignedSecondary = await createUser(relAssignedSecondaryDict);
    const relParentTaskDict = await buildTask({});
    const relFakeParentTask = await createTask(relParentTaskDict);

    const taskDict = await buildTask({
      project: relFakeProject.projectName,
      creator: relFakeCreator.id,
      assignedPrimary: relFakeAssignedPrimary.id,
      assignedSecondary: relFakeAssignedSecondary.id,
      parentTask: relFakeParentTask.id,
    });
    const fakeTask = await createTask(taskDict);

    const anotherAssignedPrimaryDict = await buildUser({});
    const anotherrelFakeAssignedPrimary = await createUser(
      anotherAssignedPrimaryDict
    );

    taskDict.assignedPrimary = anotherrelFakeAssignedPrimary.id;

    await anotherrelFakeAssignedPrimary.destroy();

    const response = await request(app).put(`${ENDPOINT}/${fakeTask.id}`).send({
      title: taskDict.title,
      body: taskDict.body,
      dueDate: taskDict.dueDate,
      status: taskDict.status,
      creation: taskDict.creation,
      priority: taskDict.priority,
      storyPoint: taskDict.storyPoint,
      project: taskDict.project,
      creator: taskDict.creator,
      assignedPrimary: taskDict.assignedPrimary,
      assignedSecondary: taskDict.assignedSecondary,
      parentTask: taskDict.parentTask,
    });

    const { statusCode } = response;
    expect(statusCode).to.equal(404);
  });
  it('Should not update task, if assignedSecondary does not exist', async () => {
    const relProjectDict = await buildProject({});
    const relFakeProject = await createProject(relProjectDict);
    const relCreatorDict = await buildUser({});
    const relFakeCreator = await createUser(relCreatorDict);
    const relAssignedPrimaryDict = await buildUser({});
    const relFakeAssignedPrimary = await createUser(relAssignedPrimaryDict);
    const relAssignedSecondaryDict = await buildUser({});
    const relFakeAssignedSecondary = await createUser(relAssignedSecondaryDict);
    const relParentTaskDict = await buildTask({});
    const relFakeParentTask = await createTask(relParentTaskDict);

    const taskDict = await buildTask({
      project: relFakeProject.projectName,
      creator: relFakeCreator.id,
      assignedPrimary: relFakeAssignedPrimary.id,
      assignedSecondary: relFakeAssignedSecondary.id,
      parentTask: relFakeParentTask.id,
    });
    const fakeTask = await createTask(taskDict);

    const anotherAssignedSecondaryDict = await buildUser({});
    const anotherrelFakeAssignedSecondary = await createUser(
      anotherAssignedSecondaryDict
    );

    taskDict.assignedSecondary = anotherrelFakeAssignedSecondary.id;

    await anotherrelFakeAssignedSecondary.destroy();

    const response = await request(app).put(`${ENDPOINT}/${fakeTask.id}`).send({
      title: taskDict.title,
      body: taskDict.body,
      dueDate: taskDict.dueDate,
      status: taskDict.status,
      creation: taskDict.creation,
      priority: taskDict.priority,
      storyPoint: taskDict.storyPoint,
      project: taskDict.project,
      creator: taskDict.creator,
      assignedPrimary: taskDict.assignedPrimary,
      assignedSecondary: taskDict.assignedSecondary,
      parentTask: taskDict.parentTask,
    });

    const { statusCode } = response;
    expect(statusCode).to.equal(404);
  });
  it('Should not update task, if parentTask does not exist', async () => {
    const relProjectDict = await buildProject({});
    const relFakeProject = await createProject(relProjectDict);
    const relCreatorDict = await buildUser({});
    const relFakeCreator = await createUser(relCreatorDict);
    const relAssignedPrimaryDict = await buildUser({});
    const relFakeAssignedPrimary = await createUser(relAssignedPrimaryDict);
    const relAssignedSecondaryDict = await buildUser({});
    const relFakeAssignedSecondary = await createUser(relAssignedSecondaryDict);
    const relParentTaskDict = await buildTask({});
    const relFakeParentTask = await createTask(relParentTaskDict);

    const taskDict = await buildTask({
      project: relFakeProject.projectName,
      creator: relFakeCreator.id,
      assignedPrimary: relFakeAssignedPrimary.id,
      assignedSecondary: relFakeAssignedSecondary.id,
      parentTask: relFakeParentTask.id,
    });
    const fakeTask = await createTask(taskDict);

    const anotherParentTaskDict = await buildTask({});
    const anotherrelFakeParentTask = await createTask(anotherParentTaskDict);

    taskDict.parentTask = anotherrelFakeParentTask.id;

    await anotherrelFakeParentTask.destroy();

    const response = await request(app).put(`${ENDPOINT}/${fakeTask.id}`).send({
      title: taskDict.title,
      body: taskDict.body,
      dueDate: taskDict.dueDate,
      status: taskDict.status,
      creation: taskDict.creation,
      priority: taskDict.priority,
      storyPoint: taskDict.storyPoint,
      project: taskDict.project,
      creator: taskDict.creator,
      assignedPrimary: taskDict.assignedPrimary,
      assignedSecondary: taskDict.assignedSecondary,
      parentTask: taskDict.parentTask,
    });

    const { statusCode } = response;
    expect(statusCode).to.equal(404);
  });

  it('Should not update task, if Task does not exists', async () => {
    const taskDict = await buildTask({});
    const fakeTask = await createTask(taskDict);
    const { id } = fakeTask;
    await fakeTask.destroy();

    const response = await request(app).put(`${ENDPOINT}/${id}`).send({
      title: taskDict.title,
      body: taskDict.body,
      dueDate: taskDict.dueDate,
      status: taskDict.status,
      creation: taskDict.creation,
      priority: taskDict.priority,
      storyPoint: taskDict.storyPoint,
      project: taskDict.project,
      creator: taskDict.creator,
      assignedPrimary: taskDict.assignedPrimary,
      assignedSecondary: taskDict.assignedSecondary,
      parentTask: taskDict.parentTask,
    });

    const { statusCode } = response;
    expect(statusCode).to.equal(404);
  });
  it('Should respond with an updated task (no updates)', async () => {
    const relProjectDict = await buildProject({});
    const relFakeProject = await createProject(relProjectDict);
    const relCreatorDict = await buildUser({});
    const relFakeCreator = await createUser(relCreatorDict);
    const relAssignedPrimaryDict = await buildUser({});
    const relFakeAssignedPrimary = await createUser(relAssignedPrimaryDict);
    const relAssignedSecondaryDict = await buildUser({});
    const relFakeAssignedSecondary = await createUser(relAssignedSecondaryDict);
    const relParentTaskDict = await buildTask({});
    const relFakeParentTask = await createTask(relParentTaskDict);

    const taskDict = await buildTask({
      project: relFakeProject.projectName,
      creator: relFakeCreator.id,
      assignedPrimary: relFakeAssignedPrimary.id,
      assignedSecondary: relFakeAssignedSecondary.id,
      parentTask: relFakeParentTask.id,
    });
    const fakeTask = await createTask(taskDict);

    const response = await request(app)
      .patch(`${ENDPOINT}/${fakeTask.id}`)
      .send({});

    const { status } = response;

    expect(status).to.equal(200);
    expect(response.statusCode).to.equal(200);
  });

  it('Should respond with an updated task', async () => {
    const relProjectDict = await buildProject({});
    const relFakeProject = await createProject(relProjectDict);
    const relCreatorDict = await buildUser({});
    const relFakeCreator = await createUser(relCreatorDict);
    const relAssignedPrimaryDict = await buildUser({});
    const relFakeAssignedPrimary = await createUser(relAssignedPrimaryDict);
    const relAssignedSecondaryDict = await buildUser({});
    const relFakeAssignedSecondary = await createUser(relAssignedSecondaryDict);
    const relParentTaskDict = await buildTask({});
    const relFakeParentTask = await createTask(relParentTaskDict);

    const taskDict = await buildTask({
      project: relFakeProject.projectName,
      creator: relFakeCreator.id,
      assignedPrimary: relFakeAssignedPrimary.id,
      assignedSecondary: relFakeAssignedSecondary.id,
      parentTask: relFakeParentTask.id,
    });
    const fakeTask = await createTask(taskDict);

    const anotherProjectDict = await buildProject({});
    const anotherrelFakeProject = await createProject(anotherProjectDict);
    const anotherCreatorDict = await buildUser({});
    const anotherrelFakeCreator = await createUser(anotherCreatorDict);
    const anotherAssignedPrimaryDict = await buildUser({});
    const anotherrelFakeAssignedPrimary = await createUser(
      anotherAssignedPrimaryDict
    );
    const anotherAssignedSecondaryDict = await buildUser({});
    const anotherrelFakeAssignedSecondary = await createUser(
      anotherAssignedSecondaryDict
    );
    const anotherParentTaskDict = await buildTask({});
    const anotherrelFakeParentTask = await createTask(anotherParentTaskDict);

    const anotherFakeTask = await buildTask({
      project: anotherrelFakeProject.projectName,
      creator: anotherrelFakeCreator.id,
      assignedPrimary: anotherrelFakeAssignedPrimary.id,
      assignedSecondary: anotherrelFakeAssignedSecondary.id,
      parentTask: anotherrelFakeParentTask.id,
    });

    const response = await request(app)
      .patch(`${ENDPOINT}/${fakeTask.id}`)
      .send({ title: anotherFakeTask.title });

    const { status } = response;
    const { data } = response.body;

    expect(status).to.equal(200);
    expect(response.statusCode).to.equal(200);

    expect(data.title).to.equal(anotherFakeTask.title);

    const updatedTask = await Task.findByPk(fakeTask.id);

    expect(updatedTask.title).to.equal(anotherFakeTask.title);
  });

  it('Should not update task, if project does not exist', async () => {
    const taskDict = await buildTask({});
    const fakeTask = await createTask(taskDict);

    const relProjectDict = await buildProject({});
    const relFakeProject = await createProject(relProjectDict);

    const relFakeProjectProjectName = relFakeProject.projectName;
    await relFakeProject.destroy();

    const response = await request(app)
      .patch(`${ENDPOINT}/${fakeTask.id}`)
      .send({
        project: relFakeProjectProjectName,
      });

    const { statusCode } = response;
    expect(statusCode).to.equal(404);
  });

  it('Should not update task, if creator does not exist', async () => {
    const taskDict = await buildTask({});
    const fakeTask = await createTask(taskDict);

    const relCreatorDict = await buildUser({});
    const relFakeCreator = await createUser(relCreatorDict);

    const relFakeCreatorId = relFakeCreator.id;
    await relFakeCreator.destroy();

    const response = await request(app)
      .patch(`${ENDPOINT}/${fakeTask.id}`)
      .send({
        creator: relFakeCreatorId,
      });

    const { statusCode } = response;
    expect(statusCode).to.equal(404);
  });

  it('Should not update task, if assignedPrimary does not exist', async () => {
    const taskDict = await buildTask({});
    const fakeTask = await createTask(taskDict);

    const relAssignedPrimaryDict = await buildUser({});
    const relFakeAssignedPrimary = await createUser(relAssignedPrimaryDict);

    const relFakeAssignedPrimaryId = relFakeAssignedPrimary.id;
    await relFakeAssignedPrimary.destroy();

    const response = await request(app)
      .patch(`${ENDPOINT}/${fakeTask.id}`)
      .send({
        assignedPrimary: relFakeAssignedPrimaryId,
      });

    const { statusCode } = response;
    expect(statusCode).to.equal(404);
  });

  it('Should not update task, if assignedSecondary does not exist', async () => {
    const taskDict = await buildTask({});
    const fakeTask = await createTask(taskDict);

    const relAssignedSecondaryDict = await buildUser({});
    const relFakeAssignedSecondary = await createUser(relAssignedSecondaryDict);

    const relFakeAssignedSecondaryId = relFakeAssignedSecondary.id;
    await relFakeAssignedSecondary.destroy();

    const response = await request(app)
      .patch(`${ENDPOINT}/${fakeTask.id}`)
      .send({
        assignedSecondary: relFakeAssignedSecondaryId,
      });

    const { statusCode } = response;
    expect(statusCode).to.equal(404);
  });

  it('Should not update task, if parentTask does not exist', async () => {
    const taskDict = await buildTask({});
    const fakeTask = await createTask(taskDict);

    const relParentTaskDict = await buildTask({});
    const relFakeParentTask = await createTask(relParentTaskDict);

    const relFakeParentTaskId = relFakeParentTask.id;
    await relFakeParentTask.destroy();

    const response = await request(app)
      .patch(`${ENDPOINT}/${fakeTask.id}`)
      .send({
        parentTask: relFakeParentTaskId,
      });

    const { statusCode } = response;
    expect(statusCode).to.equal(404);
  });

  it('Should not update task, if Task does not exists', async () => {
    const taskDict = await buildTask({});
    const fakeTask = await createTask(taskDict);
    const { id } = fakeTask;
    const title = fakeTask.title;
    await fakeTask.destroy();

    const response = await request(app)
      .patch(`${ENDPOINT}/${id}`)
      .send({ title: title });

    const { statusCode } = response;
    expect(statusCode).to.equal(404);
  });
  it('Should respond with a deleted task', async () => {
    const taskDict = await buildTask({});
    const fakeTask = await createTask(taskDict);

    const response = await request(app).delete(`${ENDPOINT}/${fakeTask.id}`);

    const { status } = response;
    const { data } = response.body;

    expect(status).to.equal(200);
    expect(response.statusCode).to.equal(200);

    expect(data.id).to.equal(fakeTask.id);

    const deletedTask = await Task.findByPk(fakeTask.id);
    expect(deletedTask).to.equal(null);
  });

  it('Should not delete task, if Task does not exists', async () => {
    const taskDict = await buildTask({});
    const fakeTask = await createTask(taskDict);
    const { id } = fakeTask;
    await fakeTask.destroy();

    const response = await request(app).delete(`${ENDPOINT}/${id}`);

    const { statusCode } = response;
    expect(statusCode).to.equal(404);
  });
});
