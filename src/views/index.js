import { h } from 'hyperapp';
import DailyExpls from './graphs/daily-expls';
import HourlyExpls from './graphs/hourly-expls';
import WeekdailyExpls from './graphs/weekdaily-expls';

export default () => (
  <div>
    <DailyExpls />
    <HourlyExpls />
    <WeekdailyExpls />
  </div>
);
