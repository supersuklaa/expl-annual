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
    top: 70,
    right: 20,
    bottom: 30,
    left: 50,
  };

  const newWidth = parseInt(d3.select(elem).style('width'), 10) - margin.left - margin.right;

  if (newWidth === width) {
    return;
  }

  width = newWidth;

  const height = 350 - margin.top - margin.bottom;

  // Parse the date / time
  const parseDate = d3.timeParse('%Y-%m-%d %H:%M:%S.%f%Z');
  const formatDay = d3.timeFormat('%Y-%m-%d');
  const formatWeekday = d3.timeFormat('%a');

  // Set the ranges
  const x = d3.scaleBand().range([0, width]);
  const y = d3.scaleLinear().range([height, 0]);

  // Define the axes
  const xAxis = d3.axisBottom(x).ticks(7);
  const yAxis = d3.axisLeft(y).ticks(5);

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

  // Count unique days for average
  const uniqDays = {};

  source.forEach((r) => {
    const date = parseDate(r.echoed_at);
    const wday = formatWeekday(date);

    if (r.was_random === 'TRUE') {
      countRexpls[wday] = countRexpls[wday] ? countRexpls[wday] + 1 : 1;
    } else {
      countExpls[wday] = countExpls[wday] ? countExpls[wday] + 1 : 1;
    }

    countBoth[wday] = countBoth[wday] ? countBoth[wday] + 1 : 1;

    const day = formatDay(date);

    if (!uniqDays[wday]) {
      uniqDays[wday] = [];
    }

    if (!uniqDays[wday].includes(day)) {
      uniqDays[wday].push(day);
    }
  });

  const mapData = d => Object.keys(d).map(key => ({
    date: key,
    avg: Math.round(d[key] / uniqDays[key].length * 100) / 100,
    count: d[key],
  }));

  const data = {
    expls: mapData(countExpls),
    rexpls: mapData(countRexpls),
    both: mapData(countBoth),
  };

  // Scale the range of the data
  x.domain(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    .paddingInner(0.1);
  y.domain([0, d3.max(data.both, d => d.avg)]);

  // Mouse hover efects
  const mouseout = function () { // eslint-disable-line
    const dday = d3.select(this).attr('data-day');
    d3.selectAll(`[data-day=${dday}`).attr('class', null);
  };

  const mouseover = function () { // eslint-disable-line
    const dday = d3.select(this).attr('data-day');
    d3.selectAll(`[data-day=${dday}`).attr('class', 'active');
  };

  // Add the blocks.
  const bothBlock = svg.selectAll('rect.both')
    .data(data.both)
    .enter()
    .append('g')
    .attr('data-day', d => d.date);

  bothBlock.append('rect')
    .attr('class', 'blocks both')
    .attr('x', d => x(d.date))
    .attr('y', d => y(d.avg))
    .attr('height', d => height - y(d.avg))
    .attr('width', x.bandwidth());

  bothBlock.append('text')
    .attr('x', d => x(d.date) + x.bandwidth() / 2)
    .attr('y', d => y(d.avg) + 18)
    .attr('text-anchor', 'middle')
    .attr('class', 'label-text both')
    .text(d => d.avg);

  bothBlock
    .on('mouseover', mouseover)
    .on('mouseout', mouseout);

  // Add the blocks.
  const mainBlock = svg.selectAll('rect.main')
    .data(data.expls)
    .enter()
    .append('g')
    .attr('data-day', d => d.date);

  mainBlock.append('rect')
    .attr('class', 'main blocks expls')
    .attr('x', d => x(d.date))
    .attr('y', d => y(d.avg))
    .attr('height', d => height - y(d.avg))
    .attr('width', x.bandwidth());

  mainBlock
    .on('mouseover', mouseover)
    .on('mouseout', mouseout);

  mainBlock.append('text')
    .attr('x', d => x(d.date) + x.bandwidth() / 2)
    .attr('y', d => y(d.avg) + 18)
    .attr('text-anchor', 'middle')
    .attr('class', 'label-text main')
    .text(d => d.avg);

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
  d3.selectAll('.weekdaily input[type=radio]')
    .on('change', function () { // eslint-disable-line
      const value = d3.select(this).attr('value');

      mainBlock.select('text')
        .data(data[value])
        .transition()
        .duration(750)
        .text(d => d.avg)
        .attr('y', d => y(d.avg) + 20);

      d3.select(elem).selectAll('.main.blocks')
        .data(data[value])
        .transition()
        .duration(750)
        .attr('class', `main blocks ${value}`)
        .attr('y', d => y(d.avg))
        .attr('height', d => height - y(d.avg));
    });
};

const init = (e, csv) => {
  source = csv;
  elem = e;
  draw();
};

window.addEventListener('resize', draw);

export default () => ({ csv }) => (
  <div class='graph-holder weekdaily'>
    <div class='blockstyle-selectors'>
      <label>
        <input type='radio' name='blockstyle' value='expls' checked='checked' />
        <div>?? expls</div>
      </label>
      <label>
        <input type='radio' name='blockstyle' value='rexpls' />
        <div>?! rexpls</div>
      </label>
    </div>
    <div class='bar-graph' oncreate={e => init(e, csv)}>
    </div>
  </div>
);
