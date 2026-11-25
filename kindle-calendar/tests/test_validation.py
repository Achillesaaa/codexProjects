import datetime as dt
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
EXT = ROOT / 'extensions/kindle-weather-check'
spec = importlib.util.spec_from_file_location('summary', EXT / 'bin/summarize.py')
summary = importlib.util.module_from_spec(spec)
spec.loader.exec_module(summary)
NOW = dt.datetime(2026, 12, 28, 9, 41, tzinfo=summary.ZONE)


def future_hours():
    return [NOW.replace(minute=0) + dt.timedelta(hours=i) for i in range(1, 49)]


def daily():
    dates = [NOW.date() + dt.timedelta(days=i) for i in range(15)]
    return [{'fi': '%s/%s' % (d.month, d.day), 'fc': '16', 'fd': '8'} for d in dates]


class ValidationTests(unittest.TestCase):
    def test_cross_year_daily(self):
        result = summary.validate('china-daily', 'var fc = ' + json.dumps({'f': daily()}) + ';', NOW)
        self.assertTrue(result['covers_today_and_next_14_days'])
        self.assertIn('2027-01-11', result['dates'])

    def test_old_fifteen_rows_are_not_valid_coverage(self):
        result = summary.daily_rows([{'fi': '1/1', 'fc': '10', 'fd': '1'}] * 15, NOW)
        self.assertFalse(result['covers_today_and_next_14_days'])

    def test_consecutive_future_hours(self):
        self.assertTrue(summary.check_hours(future_hours(), NOW)['continuous_next_24_hours'])

    def test_three_hourly_or_missing_hour_is_not_hourly(self):
        self.assertFalse(summary.check_hours(future_hours()[::3], NOW)['continuous_next_24_hours'])
        rows = future_hours()
        del rows[3]
        self.assertFalse(summary.check_hours(rows, NOW)['continuous_next_24_hours'])

    def test_stale_hourly(self):
        times = [d - dt.timedelta(days=2) for d in future_hours()]
        self.assertFalse(summary.check_hours(times, NOW)['continuous_next_24_hours'])

    def test_error_page_and_javascript_are_not_executed(self):
        for text in ['<html>Access denied</html>', 'var fc = (() => { throw 1 })()']:
            with self.assertRaises(ValueError):
                summary.validate('china-daily', text, NOW)

    def test_open_meteo_success_and_null_temperatures(self):
        dates = [str(NOW.date() + dt.timedelta(days=i)) for i in range(15)]
        body = {'current': {'time': NOW.isoformat()[:16], 'temperature_2m': 13},
                'daily': {'time': dates, 'temperature_2m_max': [16]*15, 'temperature_2m_min': [8]*15},
                'hourly': {'time': [h.isoformat()[:16] for h in future_hours()], 'temperature_2m': [13]*48}}
        result = summary.validate('open-meteo', json.dumps(body), NOW)
        self.assertTrue(result['current_within_2_hours'])
        self.assertTrue(result['covers_today_and_next_14_days'])
        self.assertTrue(result['continuous_next_24_hours'])
        body['hourly']['temperature_2m'][3] = None
        self.assertFalse(summary.validate('open-meteo', json.dumps(body), NOW)['continuous_next_24_hours'])

    def test_kual_metadata_and_shell_syntax(self):
        ET.parse(EXT / 'config.xml')
        self.assertIn('items', json.loads((EXT / 'menu.json').read_text()))
        if shutil.which('sh'):
            subprocess.run(['sh', '-n', str(EXT / 'bin/check.sh')], check=True)

    def test_parser_cli_keeps_failures_visible(self):
        with tempfile.TemporaryDirectory() as directory:
            import sys
            result = subprocess.run([sys.executable, str(EXT / 'bin/summarize.py'), directory],
                                    capture_output=True, text=True, check=True)
            self.assertEqual(result.stdout.count('NOT VERIFIED'), 4)

    @unittest.skipUnless(shutil.which('sh'), 'POSIX shell required for the Kindle launcher')
    def test_launcher_uses_only_mock_network_and_finishes(self):
        import sys
        with tempfile.TemporaryDirectory() as directory:
            temp = Path(directory)
            extension = temp / 'extension'
            shutil.copytree(EXT, extension, ignore=shutil.ignore_patterns('__pycache__', 'results'))
            tools = temp / 'mock'
            tools.mkdir()
            mock = tools / 'curl'
            mock.write_text('#!' + sys.executable + '\n' +
                            'import sys,pathlib\n'
                            'args=sys.argv[1:]\n'
                            'if "--version" in args:\n print("mock curl: no networking");sys.exit(0)\n'
                            'pathlib.Path(args[args.index("--output")+1]).write_text("<html>mock error page</html>")\n'
                            'pathlib.Path(args[args.index("--dump-header")+1]).write_text("HTTP/1.1 200 OK\\n")\n'
                            'print("HTTP_STATUS=200")\n')
            mock.chmod(0o755)
            env = dict(os.environ, PATH=str(tools) + os.pathsep + os.environ['PATH'])
            subprocess.run(['sh', str(extension / 'bin/check.sh')], env=env, check=True,
                           capture_output=True, timeout=15)
            reports = list((extension / 'results').glob('*/report.txt'))
            self.assertEqual(len(reports), 1)
            report = reports[0].read_text()
            self.assertTrue(report.strip().endswith('DONE'))
            self.assertEqual(report.count('HTTP_STATUS=200'), 4)
            self.assertEqual(report.count('NOT VERIFIED'), 4)
            self.assertFalse((extension / 'results/.running').exists())


if __name__ == '__main__':
    unittest.main()
