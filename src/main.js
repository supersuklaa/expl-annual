import { app } from 'hyperapp';
import * as d3 from 'd3';
import actions from './actions';
import view from './views';

d3.csv(require('../data/echo_history.csv')) // eslint-disable-line
  .then((csv) => {
    const state = { csv };

    app(state, actions, view, document.body);
  });
