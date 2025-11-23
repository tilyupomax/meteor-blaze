import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { TasksCollection } from '/imports/db/TasksCollection';
import '/imports/api/tasksMethods';
import '/imports/api/tasksPublications';

const insertTask = (taskText, userId) => TasksCollection.insertAsync({
  text: taskText,
  userId,
  createdAt: new Date(),
});

const SEED_USERNAME = 'meteorite';
const SEED_PASSWORD = 'password';

Meteor.startup(async () => {
  let user = await Accounts.findUserByUsername(SEED_USERNAME);

  if (!user) {
    await Accounts.createUserAsync({
      username: SEED_USERNAME,
      password: SEED_PASSWORD,
    });

    user = await Accounts.findUserByUsername(SEED_USERNAME);
  }

  if (!user) {
    throw new Meteor.Error('seed-user-not-created', 'Unable to create default Meteorite user');
  }
  const taskCount = await TasksCollection.find().countAsync();

  if (taskCount === 0) {
    const seedTasks = [
      'First Task',
      'Second Task',
      'Third Task',
      'Fourth Task',
      'Fifth Task',
      'Sixth Task',
      'Seventh Task'
    ];

    for (const taskText of seedTasks) {
      await insertTask(taskText, user._id);
    }
  }
});
