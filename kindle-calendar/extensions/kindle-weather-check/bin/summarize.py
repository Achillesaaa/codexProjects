"""Validate saved weather responses. Never executes JavaScript or makes requests."""
import datetime as dt
import json
import re
import sys
from pathlib import Path

ZONE = dt.timezone(dt.timedelta(hours=8))


def assignment(text, variable):
    match = re.search(r'\b' + re.escape(variable) + r'\s*=\s*', text)
    if not match:
        raise ValueError('Expected data variable missing; may be an error page')
    return json.JSONDecoder().raw_decode(text[match.end():].lstrip())[0]


def check_hours(times, now):
    upcoming = sorted(set(t for t in times if t >= now))[:24]
    continuous = len(upcoming) == 24 and all(
        (b - a).total_seconds() == 3600 for a, b in zip(upcoming, upcoming[1:])
    ) and 0 <= (upcoming[0] - now).total_seconds() <= 3600
    return {'upcoming_points': len(upcoming), 'continuous_next_24_hours': continuous,
            'first': str(upcoming[0]) if upcoming else None,
            'last': str(upcoming[-1]) if upcoming else None}


def daily_rows(rows, now):
    dates = []
    for row in rows:
        month, day = map(int, row['fi'].split('/'))
        options = []
        for year in [now.year - 1, now.year, now.year + 1]:
            try:
                options.append(dt.date(year, month, day))
            except ValueError:
                pass
        date = min(options, key=lambda d: abs((d - now.date()).days))
        float(row['fc'])
        float(row['fd'])
        dates.append(date)
    expected = {now.date() + dt.timedelta(days=i) for i in range(15)}
    return {'rows': len(rows), 'dates': [str(d) for d in dates],
            'covers_today_and_next_14_days': expected.issubset(set(dates)),
            'note': 'Year inferred from month/day; inspect provider publication time.'}


def validate(name, text, now):
    if name == 'china-now':
        data = assignment(text, 'dataSK')
        float(data['temp'])
        return {k: data.get(k) for k in ['cityname', 'temp', 'weather', 'date', 'time']}
    if name == 'china-daily':
        return daily_rows(assignment(text, 'fc')['f'], now)
    if name == 'china-hourly':
        rows = assignment(text, 'fc180')['jh']
        times = []
        for row in rows:
            float(row['jb'])
            times.append(dt.datetime.strptime(str(row['jf'])[:12], '%Y%m%d%H%M').replace(tzinfo=ZONE))
        return {'rows': len(rows), **check_hours(times, now)}
    if name != 'open-meteo':
        raise ValueError('Unknown source')
    data = json.loads(text)
    if data.get('error'):
        raise ValueError(str(data.get('reason', 'API error')))
    daily = data['daily']
    dates = [dt.date.fromisoformat(s) for s in daily['time']]
    if any(len(daily[k]) != len(dates) for k in ['temperature_2m_max', 'temperature_2m_min']):
        raise ValueError('Incomplete daily arrays')
    for value in daily['temperature_2m_max'] + daily['temperature_2m_min']:
        float(value)
    current = data['current']
    float(current['temperature_2m'])
    current_age = (now - dt.datetime.fromisoformat(current['time']).replace(tzinfo=ZONE)).total_seconds()
    hourly = data['hourly']
    if len(hourly['time']) != len(hourly['temperature_2m']):
        raise ValueError('Incomplete hourly arrays')
    times = []
    for stamp, temperature in zip(hourly['time'], hourly['temperature_2m']):
        if temperature is not None:
            float(temperature)
            times.append(dt.datetime.fromisoformat(stamp).replace(tzinfo=ZONE))
    expected = {now.date() + dt.timedelta(days=i) for i in range(15)}
    return {'daily_rows': len(dates), 'covers_today_and_next_14_days': expected.issubset(set(dates)),
            'current_age_minutes': round(current_age / 60, 1),
            'current_within_2_hours': 0 <= current_age <= 7200, **check_hours(times, now)}


def main(root):
    now = dt.datetime.now(ZONE)
    print('Validation time: ' + now.isoformat())
    for name in ['china-now', 'china-daily', 'china-hourly', 'open-meteo']:
        try:
            text = (root / (name + '.body')).read_text(encoding='utf-8-sig', errors='replace')
            result = validate(name, text, now)
            print(name + ': ' + json.dumps(result, ensure_ascii=False))
        except Exception as exc:
            print(name + ': NOT VERIFIED: ' + str(exc))
    print('Coverage depends on a correct device clock. HTTP 200 alone is not verification.')


if __name__ == '__main__':
    main(Path(sys.argv[1]))
