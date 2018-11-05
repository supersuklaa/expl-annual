import { h } from 'hyperapp';
import * as d3 from 'd3';

let elem;
let source;
let width;

const draw = () => {
  if (!elem || !source) {
    return;
  }

  // Set the dimensions of the canvas / graph
  const margin = {
    top: 30,
    right: 20,
    bottom: 30,
    left: 50,
  };

  const newWidth = parseInt(d3.select(elem).style('width'), 10) - margin.left - margin.right;

  if (newWidth === width) {
    return;
  }

  width = newWidth;

  const height = 450 - margin.top - margin.bottom;

  // Parse the date / time
  const parseDate = d3.timeParse('%Y-%m-%d %H:%M:%S.%f%Z');
  const formatDay = d3.timeFormat('%Y-%m-%d');
  const formatHour = d3.timeFormat('%-H');

  // Set the ranges
  const x = d3.scaleTime().range([0, width]);
  const y = d3.scaleLinear().range([height, 0]);

  // define the area
  const area = d3.area()
    .x(d => x(d.date))
    .y0(height)
    .y1(d => y(d.avg))
    .curve(d3.curveMonotoneX);

  // Remove old canvas
  d3.select(elem).select('svg').remove();

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

  // Populate 0 for every hour
  for (let i = 0; i <= 23; i++) { // eslint-disable-line
    countBoth[i] = 0;
    countExpls[i] = 0;
    countRexpls[i] = 0;
  }

  // Count unique days for average
  const uniqDays = [];

  source.forEach((r) => {
    const date = parseDate(r.echoed_at);
    const hour = formatHour(date);

    if (r.was_random === 'TRUE') {
      countRexpls[hour] = countRexpls[hour] ? countRexpls[hour] + 1 : 1;
    } else {
      countExpls[hour] = countExpls[hour] ? countExpls[hour] + 1 : 1;
    }

    countBoth[hour] = countBoth[hour] ? countBoth[hour] + 1 : 1;

    const day = formatDay(date);

    if (!uniqDays.includes(day)) {
      uniqDays.push(day);
    }
  });

  const mapData = d => Object.keys(d)
    .map(key => ({
      date: d3.timeParse('%Y-%m-%d %H')(`2000-01-28 ${key}`),
      avg: Math.round(d[key] / uniqDays.length * 100) / 100,
      count: d[key],
    }))
    .sort((a, b) => a.date - b.date);

  const data = {
    expls: mapData(countExpls),
    rexpls: mapData(countRexpls),
    both: mapData(countBoth),
  };

  // Scale the range of the data
  x.domain(d3.extent(data.both, d => d.date));
  y.domain([0, d3.max(data.both, d => d.avg)]);

  // Add the X gridlines
  svg.append('g')
    .attr('class', 'grid')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(x).ticks(24).tickSize(-height).tickFormat(''));

  // Add the X gridlines
  svg.append('g')
    .attr('class', 'grid')
    .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(''));

  // Add the area path.
  svg.append('path')
    .attr('class', 'line both')
    .attr('d', area(data.both));

  // Add the area path.
  svg.append('path')
    .attr('class', 'main line expls')
    .attr('d', area(data.expls));

  // Add the focus y-value hover efect
  const focusMain = svg.append('g')
    .attr('data-style', 'expls')
    .attr('class', 'focus');

  const focusBoth = svg.append('g')
    .attr('class', 'focus');

  const getLinePoint = (x0, data0) => {
    const i = d3.bisector(d => d.date).left(data0, x0, 1);
    const d0 = data0[i - 1];
    const d1 = data0[i];
    return x0 - d0.date > d1.date - x0 ? d1 : d0;
  };

  const mousemove = function () { //eslint-disable-line
    const x0 = x.invert(d3.mouse(this)[0]);
    const dataStyle = focusMain.attr('data-style');

    const d = getLinePoint(x0, data[dataStyle]);
    focusMain.attr('transform', `translate(${x(d.date)}, ${y(d.avg)})`);
    focusMain.select('text.main').text(d.avg);

    const d2 = getLinePoint(x0, data.both);
    focusBoth.attr('transform', `translate(${x(d2.date)}, ${y(d2.avg)})`);

    if (y(d.avg) - y(d2.avg) < 10) {
      focusBoth.select('text.both').attr('y', y(d.avg) - y(d2.avg) - 12);
    } else {
      focusBoth.select('text.both').attr('y', '0');
    }
    focusBoth.select('text.both').text(d2.avg);
  };

  svg.append('rect')
    .attr('class', 'overlay')
    .attr('width', width)
    .attr('height', height)
    .on('mouseover', () => svg.attr('class', 'active'))
    .on('mouseout', () => svg.attr('class', null))
    .on('mousemove', mousemove);

  focusMain.append('circle')
    .attr('class', 'main')
    .attr('r', 4.5);

  focusMain.append('text')
    .attr('class', 'main')
    .attr('x', 9)
    .attr('dy', '.35em');

  focusBoth.append('circle')
    .attr('class', 'both')
    .attr('r', 4.5);

  focusBoth.append('text')
    .attr('class', 'both')
    .attr('x', 9)
    .attr('dy', '.35em');

  // Add the X Axis
  svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate(0, ${height})`)
    .call(
      d3.axisBottom(x)
        .ticks(parseInt(width / 42, 10))
        .tickFormat(d3.timeFormat('%H')),
    );

  // Add the Y Axis
  svg.append('g')
    .attr('class', 'y axis')
    .call(d3.axisLeft(y).ticks(5));

  // Event listener for radio buttons
  d3.selectAll('.hourly input[type=radio]')
    .on('change', function () { // eslint-disable-line
      const value = d3.select(this).attr('value');

      d3.select(elem)
        .transition()
        .select('.main.line')
        .duration(750)
        .attr('d', area(data[value]))
        .attr('class', `main line ${value}`);

      focusMain.attr('data-style', value);
    });
};

const init = (e, csv) => {
  source = csv;
  elem = e;
  draw();
};

window.addEventListener('resize', draw);

export default () => ({ csv }) => (
  <div class='graph-holder hourly'>
    <div class='linestyle-selectors'>
      <label>
        <input type='radio' name='hourlylines' value='expls' checked='checked' />
        <div>?? expls</div>
      </label>
      <label>
        <input type='radio' name='hourlylines' value='rexpls' />
        <div>?! rexpls</div>
      </label>
    </div>
    <div class='line-graph' oncreate={e => init(e, csv)}>
    </div>
  </div>
);
