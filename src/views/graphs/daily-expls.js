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

  const mapData = d => Object.keys(d)
    .map(key => ({
      date: d3.timeParse('%Y-%m-%d')(key),
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
  y.domain([0, d3.max(data.both, d => d.count)]);

  // add the X gridlines
  svg.append('g')
    .attr('class', 'grid')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(x).ticks(5).tickSize(-height).tickFormat(''));

  // add the X gridlines
  svg.append('g')
    .attr('class', 'grid')
    .call(d3.axisLeft(y).ticks(7).tickSize(-width).tickFormat(''));

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
    .call(d3.axisBottom(x).ticks(10).tickFormat(d3.timeFormat('%-d.%-m')));

  // Add the Y Axis
  svg.append('g')
    .attr('class', 'y axis')
    .call(d3.axisLeft(y).ticks(3));

  // Add the focus y-value hover efect
  const focusMain = svg.append('g')
    .attr('data-style', 'expls')
    .attr('class', 'focus');

  const focusBoth = svg.append('g')
    .attr('class', 'focus');

  const focusDate = svg.append('g')
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
    focusMain.attr('transform', `translate(${x(d.date)}, ${y(d.count)})`);
    focusMain.select('text.main').text(d.count);

    const d2 = getLinePoint(x0, data.both);
    focusBoth.attr('transform', `translate(${x(d2.date)}, ${y(d2.count)})`);

    if (y(d.count) - y(d2.count) < 10) {
      focusBoth.select('text.both').attr('y', y(d.count) - y(d2.count) - 12);
    } else {
      focusBoth.select('text.both').attr('y', '0');
    }
    focusBoth.select('text.both').text(d2.count);

    focusDate.attr('transform', `translate(${x(d.date)}, ${height + 17})`);
    focusDate.select('text.date')
      .text(d3.timeFormat('%-d.%-m')(d.date));
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

  focusDate.append('text')
    .attr('class', 'date');

  // Event listener for radio buttons
  d3.selectAll('.daily input[type=radio]')
    .on('change', function () { // eslint-disable-line
      const value = d3.select(this).attr('value');

      d3.select(elem).transition().select('.main.line')
        .duration(750)
        .attr('d', area(data[value]))
        .attr('class', `main line ${value}`);

      focusMain.attr('data-style', value);
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
