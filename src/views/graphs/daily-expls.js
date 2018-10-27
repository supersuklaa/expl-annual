import { h } from 'hyperapp';
import * as d3 from 'd3';

const draw = (elem, csv) => {
  if (!elem || !csv) {
    return;
  }

  // Set the dimensions of the canvas / graph
  const margin = {
    top: 30,
    right: 20,
    bottom: 30,
    left: 50,
  };

  const width = 1000 - margin.left - margin.right;

  const height = 450 - margin.top - margin.bottom;

  // Parse the date / time
  const parseDate = d3.timeParse('%Y-%m-%d %H:%M:%S.%f%Z');
  const formatDay = d3.timeFormat('%Y-%m-%d');

  // Set the ranges
  const x = d3.scaleTime().range([0, width]);
  const y = d3.scaleLinear().range([height, 0]);

  // Define the axes
  const xAxis = d3.axisBottom(x).ticks(5);
  const yAxis = d3.axisLeft(y).ticks(5);

  // define the area
  const area = d3.area()
    .x(d => x(d.date))
    .y0(height)
    .y1(d => y(d.count))
    .curve(d3.curveMonotoneX);

  // Adds the svg canvas
  const svg = d3.select(elem)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // Play with the data
  const countBoth = {};
  const countExpls = {};
  const countRexpls = {};

  csv.forEach((r) => {
    const date = parseDate(r.echoed_at);
    const day = formatDay(date);

    if (r.was_random === 'TRUE') {
      countRexpls[day] = countRexpls[day] ? countRexpls[day] + 1 : 1;
    } else {
      countExpls[day] = countExpls[day] ? countExpls[day] + 1 : 1;
    }

    countBoth[day] = countBoth[day] ? countBoth[day] + 1 : 1;
  });

  const popu = d => Object.keys(d)
    .map(key => ({
      date: d3.timeParse('%Y-%m-%d')(key),
      count: d[key],
    }))
    .sort((a, b) => a.date - b.date);

  const data = {
    expls: popu(countExpls),
    rexpls: popu(countRexpls),
    both: popu(countBoth),
  };

  // Scale the range of the data
  x.domain(d3.extent(data.both, d => d.date));
  y.domain([0, d3.max(data.both, d => d.count)]);

  // Add the area path.
  svg.append('path')
    .attr('class', 'line both')
    .attr('d', area(data.both));

  // Add the area path.
  svg.append('path')
    .attr('class', 'main line expls')
    .attr('d', area(data.expls));

  // Add the X Axis
  svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate(0, ${height})`)
    .call(xAxis);

  // Add the Y Axis
  svg.append('g')
    .attr('class', 'y axis')
    .call(yAxis);

  // Event listener for radio buttons
  d3.selectAll('.daily input[type=radio]')
    .on('change', function () { // eslint-disable-line
      const value = d3.select(this).attr('value');

      d3.select(elem).transition().select('.main.line')
        .duration(750)
        .attr('d', area(data[value]))
        .attr('class', `main line ${value}`);
    });
};

export default () => ({ csv }) => (
  <div class='graph-holder daily'>
    <div class='linestyle-selectors'>
      <label>
        <input type='radio' name='linestyle' value='expls' checked='checked' />
        <div>?? expls</div>
      </label>
      <label>
        <input type='radio' name='linestyle' value='rexpls' />
        <div>?! rexpls</div>
      </label>
    </div>
    <div class='graph' oncreate={e => draw(e, csv)}>
    </div>
  </div>
);
