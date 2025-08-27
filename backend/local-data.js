// Local data store for development when MongoDB is not available
const { v4: uuidv4 } = require('uuid');

// In-memory data stores
let users = [];
let weeklyUpdates = [];
let visits = [];
let resources = [];

// Initialize with some sample data
const initializeData = async () => {
  console.log('🔄 Initializing local data store...');
  
  // Sample users
  users = [
    {
      _id: uuidv4(),
      username: 'admin',
      passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', // password: admin123
      role: 'admin',
      createdAt: new Date()
    },
    {
      _id: uuidv4(),
      username: 'student1',
      passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', // password: admin123
      role: 'student',
      createdAt: new Date()
    }
  ];

  // Sample weekly updates
  weeklyUpdates = [
    {
      _id: uuidv4(),
      weekNumber: 1,
      title: 'Week 1 - Introduction to Career Guidance',
      description: 'Getting started with career exploration and self-assessment',
      activities: 'Introduction to career guidance, personality assessments, and goal setting',
      highlights: 'Students completed personality tests and identified their interests',
      gallery: [],
      reportURL: '',
      createdAt: new Date()
    },
    {
      _id: uuidv4(),
      weekNumber: 2,
      title: 'Week 2 - Career Exploration',
      description: 'Exploring different career paths and opportunities',
      activities: 'Career research, industry analysis, and professional interviews',
      highlights: 'Students researched 3 different career paths and interviewed professionals',
      gallery: [],
      reportURL: '',
      createdAt: new Date()
    }
  ];

  console.log('✅ Local data store initialized with sample data');
};

// User operations
const findUserByUsername = (username) => {
  return users.find(user => user.username === username);
};

const addUser = (userData) => {
  const newUser = {
    _id: uuidv4(),
    ...userData,
    createdAt: new Date()
  };
  users.push(newUser);
  return newUser;
};

const getUsers = () => users;

// Weekly updates operations
const getWeeklyUpdates = () => weeklyUpdates;

const addWeeklyUpdate = (updateData) => {
  const newUpdate = {
    _id: uuidv4(),
    ...updateData,
    createdAt: new Date()
  };
  weeklyUpdates.push(newUpdate);
  return newUpdate;
};

// Visits operations
const getVisits = () => visits;

const addVisit = (visitData) => {
  const newVisit = {
    _id: uuidv4(),
    ...visitData,
    createdAt: new Date()
  };
  visits.push(newVisit);
  return newVisit;
};

// Resources operations
const getResources = () => resources;

const addResource = (resourceData) => {
  const newResource = {
    _id: uuidv4(),
    ...resourceData,
    createdAt: new Date()
  };
  resources.push(newResource);
  return newResource;
};

module.exports = {
  initializeData,
  findUserByUsername,
  addUser,
  getUsers,
  getWeeklyUpdates,
  addWeeklyUpdate,
  getVisits,
  addVisit,
  getResources,
  addResource
};