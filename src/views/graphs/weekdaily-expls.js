import { h } from 'hyperapp';
import * as d3 from 'd3';

const draw = (elem, csv) => {
  if (!elem || !csv) {
    return;
  }

  // Set the dimensions of the canvas / graph
  const margin = {
    top: 70,
    right: 20,
    bottom: 30,
    left: 50,
  };

  const width = 600 - margin.left - margin.right;

  const height = 350 - margin.top - margin.bottom;

  // Parse the date / time
  const parseDate = d3.timeParse('%Y-%m-%d %H:%M:%S.%f%Z');
  const formatWeekday = d3.timeFormat('%a');

  // Set the ranges
  const x = d3.scaleBand().range([0, width]);
  const y = d3.scaleLinear().range([height, 0]);

  // Define the axes
  const xAxis = d3.axisBottom(x).ticks(7);
  const yAxis = d3.axisLeft(y).ticks(5);

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
    const day = formatWeekday(date);

    if (r.was_random === 'TRUE') {
      countRexpls[day] = countRexpls[day] ? countRexpls[day] + 1 : 1;
    } else {
      countExpls[day] = countExpls[day] ? countExpls[day] + 1 : 1;
    }

    countBoth[day] = countBoth[day] ? countBoth[day] + 1 : 1;
  });

  const popu = d => Object.keys(d).map(key => ({
    date: key,
    count: d[key],
  }));


  const data = {
    expls: popu(countExpls),
    rexpls: popu(countRexpls),
    both: popu(countBoth),
  };

  // Scale the range of the data
  x.domain(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    .paddingInner(0.1);
  y.domain([0, d3.max(data.both, d => d.count)]);

  // Add the blocks.
  svg.selectAll('rect.both')
    .data(data.both)
    .enter()
    .append('rect')
    .attr('class', 'blocks both')
    .attr('x', d => x(d.date))
    .attr('y', d => y(d.count))
    .attr('height', d => height - y(d.count))
    .attr('width', x.bandwidth());

  // Add the blocks.
  svg.selectAll('rect.main')
    .data(data.expls)
    .enter()
    .append('rect')
    .attr('class', 'main blocks expls')
    .attr('x', d => x(d.date))
    .attr('y', d => y(d.count))
    .attr('height', d => height - y(d.count))
    .attr('width', x.bandwidth());

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

      d3.select(elem).selectAll('.main.blocks')
        .data(data[value])
        .transition()
        .duration(750)
        .attr('class', `main blocks ${value}`)
        .attr('y', d => y(d.count))
        .attr('height', d => height - y(d.count));
    });
};

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
    <div class='graph' oncreate={e => draw(e, csv)}>
    </div>
  </div>
);
