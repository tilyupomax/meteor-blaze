import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Tracker } from 'meteor/tracker';
import { TasksCollection } from '../db/TasksCollection';
import '../api/tasksMethods';

import './App.html';
import './Task.js';
import './Login.js';

const HIDE_COMPLETED_STRING = 'hideCompleted';
const IS_LOADING_STRING = 'isLoading';
const fetchUser = () => Meteor.user();
const isUserLoggedIn = () => !!fetchUser();

const getTasksFilter = () => {
  const user = fetchUser();

  const hideCompletedFilter = { isChecked: { $ne: true } };
  const userFilter = user ? { userId: user._id } : {};

  return {
    userFilter,
    pendingOnlyFilter: { ...hideCompletedFilter, ...userFilter },
  };
};

Template.mainContainer.onCreated(function mainContainerOnCreated() {
  this.state = new ReactiveDict();

  const handler = Meteor.subscribe('tasks');
  Tracker.autorun(() => {
    this.state.set(IS_LOADING_STRING, !handler.ready());
  });
});

Template.mainContainer.helpers({
  tasks() {
    const instance = Template.instance();
    const hideCompleted = instance.state.get(HIDE_COMPLETED_STRING);

    if (!isUserLoggedIn()) {
      return [];
    }

    const { pendingOnlyFilter, userFilter } = getTasksFilter();

    return TasksCollection.find(
      hideCompleted ? pendingOnlyFilter : userFilter,
      { sort: { createdAt: -1 } },
    ).fetch();
  },
  hideCompleted() {
    return Template.instance().state.get(HIDE_COMPLETED_STRING);
  },
  incompleteCount() {
    if (!isUserLoggedIn()) {
      return '';
    }

    const { pendingOnlyFilter } = getTasksFilter();
    const incompleteTasksCount = TasksCollection.find(pendingOnlyFilter).count();
    return incompleteTasksCount ? `(${incompleteTasksCount})` : '';
  },
  isUserLogged() {
    return isUserLoggedIn();
  },
  getUser() {
    return fetchUser();
  },
  isLoading() {
    const instance = Template.instance();
    return instance.state.get(IS_LOADING_STRING);
  },
});

Template.mainContainer.events({
  'click #hide-completed-button'(event, instance) {
    const currentHideCompleted = instance.state.get(HIDE_COMPLETED_STRING);
    instance.state.set(HIDE_COMPLETED_STRING, !currentHideCompleted);
  },
  'click .user'() {
    Meteor.logout();
  },
});

Template.form.events({
  'submit .task-form'(event) {
    event.preventDefault();

    const target = event.target;
    const text = target.text.value;
    Meteor.call('tasks.insert', text);

    target.text.value = '';
  },
});
