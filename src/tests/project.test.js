import request from 'supertest';
import { expect } from 'chai';
import {
  buildProject,
  buildUser,
  createProject,
  createUser,
} from './factories';
import { startDatabase } from './utils';
import { Project, User } from 'data/models';
import { app } from 'server/app';
import { server } from 'server/index';

const ENDPOINT = '/project';

describe('Project tests', () => {
  beforeEach(async () => {
    await startDatabase();
  });

  after(async () => {
    await server.close();
  });

  it('Should respond with a new created project', async () => {
    const relCreatorDict = await buildUser({});
    const relFakeCreator = await createUser(relCreatorDict);

    const fakeProject = await buildProject({ creator: relFakeCreator.id });

    const response = await request(app).post(ENDPOINT).send(fakeProject);

    expect(response.status).to.equal(201);
    expect(response.statusCode).to.equal(201);

    const responseProject = response.body.data;

    const project = await Project.findByPk(responseProject.projectName);

    expect(project.creation.toJSON()).to.eql(fakeProject.creation);

    expect(project.creator).to.equal(fakeProject.creator);
  });

  it('Should not create project if creator does not exist', async () => {
    const fakeProject = await buildProject({});
    const creator = await User.findOne({ where: { id: fakeProject.creator } });
    await creator.destroy();

    const response = await request(app).post(ENDPOINT).send(fakeProject);

    const { statusCode } = response;
    expect(statusCode).to.equal(404);
  });

  it('Should respond with a project', async () => {
    const relCreatorDict = await buildUser({});
    const relFakeCreator = await createUser(relCreatorDict);

    const projectDict = await buildProject({ creator: relFakeCreator.id });
    const fakeProject = await createProject(projectDict);

    const response = await request(app).get(
      `${ENDPOINT}/${fakeProject.projectName}`
    );

    const { statusCode, status } = response;
    const { data } = response.body;

    expect(status).to.equal(200);
    expect(statusCode).to.equal(200);

    expect(data.projectName).to.equal(fakeProject.projectName);
    expect(data.creation).to.equal(fakeProject.creation.toJSON());

    expect(data.tasks).to.eql([]);
    expect(data.creator).to.equal(fakeProject.creator);
  });
  it('Should throw an error if project was not found', async () => {
    const projectDict = await buildProject({});
    const fakeProject = await createProject(projectDict);
    const { projectName } = fakeProject;
    await fakeProject.destroy();

    const response = await request(app).get(`${ENDPOINT}/${projectName}`);
    const { statusCode } = response;
    expect(statusCode).to.equal(404);
  });
  it('Should respond with a list of projects', async () => {
    const response = await request(app).get(ENDPOINT);

    const { statusCode, status } = response;
    const { data } = response.body;

    expect(status).to.equal(200);
    expect(statusCode).to.equal(200);

    const allProject = await Project.findAll();
    expect(data.length).to.equal(allProject.length);
  });
  it('Should respond with an updated project', async () => {
    const relCreatorDict = await buildUser({});
    const relFakeCreator = await createUser(relCreatorDict);

    const projectDict = await buildProject({ creator: relFakeCreator.id });
    const fakeProject = await createProject(projectDict);

    const anotherCreatorDict = await buildUser({});
    const anotherrelFakeCreator = await createUser(anotherCreatorDict);

    const anotherFakeProject = await buildProject({
      creator: anotherrelFakeCreator.id,
    });

    const response = await request(app)
      .put(`${ENDPOINT}/${fakeProject.projectName}`)
      .send({
        creation: anotherFakeProject.creation,
        creator: anotherFakeProject.creator,
      });

    const { status } = response;
    const { data } = response.body;

    expect(status).to.equal(200);
    expect(response.statusCode).to.equal(200);

    expect(data.creation).to.equal(anotherFakeProject.creation);
    expect(data.creator).to.equal(anotherFakeProject.creator);

    const updatedProject = await Project.findByPk(fakeProject.projectName);

    expect(updatedProject.creation.toJSON()).to.eql(
      anotherFakeProject.creation
    );

    expect(updatedProject.creator).to.equal(anotherFakeProject.creator);
  });

  it('Should not update project, if creator does not exist', async () => {
    const relCreatorDict = await buildUser({});
    const relFakeCreator = await createUser(relCreatorDict);

    const projectDict = await buildProject({ creator: relFakeCreator.id });
    const fakeProject = await createProject(projectDict);

    const anotherCreatorDict = await buildUser({});
    const anotherrelFakeCreator = await createUser(anotherCreatorDict);

    projectDict.creator = anotherrelFakeCreator.id;

    await anotherrelFakeCreator.destroy();

    const response = await request(app)
      .put(`${ENDPOINT}/${fakeProject.projectName}`)
      .send({
        creation: projectDict.creation,
        creator: projectDict.creator,
      });

    const { statusCode } = response;
    expect(statusCode).to.equal(404);
  });

  it('Should not update project, if Project does not exists', async () => {
    const projectDict = await buildProject({});
    const fakeProject = await createProject(projectDict);
    const { projectName } = fakeProject;
    await fakeProject.destroy();

    const response = await request(app).put(`${ENDPOINT}/${projectName}`).send({
      creation: projectDict.creation,
      creator: projectDict.creator,
    });

    const { statusCode } = response;
    expect(statusCode).to.equal(404);
  });
  it('Should respond with an updated project (no updates)', async () => {
    const relCreatorDict = await buildUser({});
    const relFakeCreator = await createUser(relCreatorDict);

    const projectDict = await buildProject({ creator: relFakeCreator.id });
    const fakeProject = await createProject(projectDict);

    const response = await request(app)
      .patch(`${ENDPOINT}/${fakeProject.projectName}`)
      .send({});

    const { status } = response;

    expect(status).to.equal(200);
    expect(response.statusCode).to.equal(200);
  });

  it('Should respond with a deleted project', async () => {
    const projectDict = await buildProject({});
    const fakeProject = await createProject(projectDict);

    const response = await request(app).delete(
      `${ENDPOINT}/${fakeProject.projectName}`
    );

    const { status } = response;
    const { data } = response.body;

    expect(status).to.equal(200);
    expect(response.statusCode).to.equal(200);

    expect(data.projectName).to.equal(fakeProject.projectName);

    const deletedProject = await Project.findByPk(fakeProject.projectName);
    expect(deletedProject).to.equal(null);
  });

  it('Should not delete project, if Project does not exists', async () => {
    const projectDict = await buildProject({});
    const fakeProject = await createProject(projectDict);
    const { projectName } = fakeProject;
    await fakeProject.destroy();

    const response = await request(app).delete(`${ENDPOINT}/${projectName}`);

    const { statusCode } = response;
    expect(statusCode).to.equal(404);
  });
});
