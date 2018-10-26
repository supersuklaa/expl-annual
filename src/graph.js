import { h } from 'hyperapp';
import * as d3 from 'd3';

const init = (elem) => {
  // Set the dimensions of the canvas / graph
  const margin = {
    top: 30,
    right: 20,
    bottom: 30,
    left: 50,
  };

  const width = 600 - margin.left - margin.right;

  const height = 270 - margin.top - margin.bottom;

  // Parse the date / time
  const parseDate = d3.timeParse('%Y-%m-%d %H:%M:%S.%f%Z');
  const formatDay = d3.timeFormat('%Y-%m-%d');

  // Set the ranges
  const x = d3.scaleTime().range([0, width]);
  const y = d3.scaleLinear().range([height, 0]);

  // Define the axes
  const xAxis = d3.axisBottom(x).ticks(5);
  const yAxis = d3.axisLeft(y).ticks(5);

  // Define the line
  const valueline = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.count));

  // Adds the svg canvas
  const svg = d3.select(elem)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // Get the data
  d3.csv(require('../data/echo_history.csv')).then((rows) => { // eslint-disable-line
    const counts = {};
    rows.forEach((r) => {
      const date = parseDate(r.echoed_at);
      const day = formatDay(date);
      if (!counts[day]) {
        counts[day] = 0;
      }
      counts[day]++; // eslint-disable-line
    });

    const data = [];
    Object.keys(counts).forEach((key) => {
      data.push({
        date: d3.timeParse('%Y-%m-%d')(key),
        count: counts[key],
      });
    });

    // Scale the range of the data
    x.domain(d3.extent(data, d => d.date));
    y.domain([0, d3.max(data, d => d.count)]);

    // Add the valueline path.
    svg.append('path')
      .attr('class', 'line')
      .attr('d', valueline(data));

    // Add the X Axis
    svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxis);

    // Add the Y Axis
    svg.append('g')
      .attr('class', 'y axis')
      .call(yAxis);
  });
};

export default () => (
  <div oncreate={e => init(e)}>
  </div>
);
