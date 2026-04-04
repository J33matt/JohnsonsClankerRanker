const WEEKLY_RANKINGS = [{"date":"2025-10-27","label":"Oct 27","rankings":[{"team":"SAS","power":83.3,"wins":8,"losses":0,"netRtg":15.0,"rank":1},{"team":"HOU","power":72.1,"wins":5,"losses":2,"netRtg":9.3,"rank":2},{"team":"DEN","power":68.2,"wins":5,"losses":2,"netRtg":6.4,"rank":3},{"team":"MIL","power":62.2,"wins":5,"losses":2,"netRtg":4.6,"rank":4},{"team":"OKC","power":61.8,"wins":8,"losses":2,"netRtg":3.3,"rank":5},{"team":"BOS","power":60.8,"wins":4,"losses":4,"netRtg":8.0,"rank":6},{"team":"CHI","power":59.1,"wins":6,"losses":2,"netRtg":2.8,"rank":7},{"team":"LAC","power":58.4,"wins":4,"losses":2,"netRtg":4.3,"rank":8},{"team":"CHA","power":56.3,"wins":4,"losses":4,"netRtg":5.2,"rank":9},{"team":"NYK","power":54.2,"wins":5,"losses":2,"netRtg":2.6,"rank":10},{"team":"ORL","power":53.6,"wins":4,"losses":3,"netRtg":4.1,"rank":11},{"team":"GSW","power":51.7,"wins":6,"losses":3,"netRtg":1.9,"rank":12},{"team":"DAL","power":46.8,"wins":4,"losses":4,"netRtg":1.6,"rank":13},{"team":"CLE","power":44.3,"wins":4,"losses":4,"netRtg":0.5,"rank":14},{"team":"PHI","power":43.5,"wins":4,"losses":2,"netRtg":-2.0,"rank":15},{"team":"DET","power":41.5,"wins":4,"losses":4,"netRtg":-0.2,"rank":16},{"team":"TOR","power":40.8,"wins":5,"losses":5,"netRtg":-0.4,"rank":17},{"team":"UTA","power":39.9,"wins":3,"losses":4,"netRtg":-0.4,"rank":18},{"team":"POR","power":39.4,"wins":3,"losses":5,"netRtg":1.0,"rank":19},{"team":"PHX","power":34.3,"wins":4,"losses":4,"netRtg":-1.9,"rank":20},{"team":"MIA","power":29.4,"wins":2,"losses":6,"netRtg":-1.5,"rank":21},{"team":"WAS","power":21.9,"wins":2,"losses":4,"netRtg":-5.7,"rank":22},{"team":"ATL","power":20.0,"wins":3,"losses":5,"netRtg":-7.2,"rank":23},{"team":"SAC","power":18.7,"wins":2,"losses":5,"netRtg":-5.1,"rank":24},{"team":"LAL","power":18.4,"wins":3,"losses":7,"netRtg":-5.6,"rank":25},{"team":"MIN","power":15.7,"wins":2,"losses":6,"netRtg":-6.4,"rank":26},{"team":"MEM","power":14.1,"wins":3,"losses":6,"netRtg":-7.4,"rank":27},{"team":"IND","power":12.8,"wins":2,"losses":5,"netRtg":-9.1,"rank":28},{"team":"BKN","power":4.3,"wins":1,"losses":6,"netRtg":-10.4,"rank":29},{"team":"NOP","power":-0.9,"wins":0,"losses":5,"netRtg":-10.2,"rank":30}]},{"date":"2025-11-03","label":"Nov 03","rankings":[{"team":"SAS","power":79.5,"wins":9,"losses":1,"netRtg":11.4,"rank":1},{"team":"HOU","power":78.4,"wins":8,"losses":2,"netRtg":11.8,"rank":2},{"team":"OKC","power":71.0,"wins":11,"losses":2,"netRtg":6.8,"rank":3},{"team":"DEN","power":70.3,"wins":7,"losses":3,"netRtg":8.3,"rank":4},{"team":"MIL","power":62.9,"wins":8,"losses":3,"netRtg":4.7,"rank":5},{"team":"CHI","power":59.5,"wins":8,"losses":3,"netRtg":3.0,"rank":6},{"team":"ORL","power":59.1,"wins":6,"losses":4,"netRtg":5.7,"rank":7},{"team":"DET","power":55.5,"wins":7,"losses":4,"netRtg":3.4,"rank":8},{"team":"BOS","power":53.1,"wins":6,"losses":6,"netRtg":4.7,"rank":9},{"team":"NYK","power":52.4,"wins":7,"losses":4,"netRtg":2.5,"rank":10},{"team":"PHI","power":51.6,"wins":6,"losses":3,"netRtg":1.8,"rank":11},{"team":"GSW","power":49.3,"wins":7,"losses":5,"netRtg":1.8,"rank":12},{"team":"PHX","power":46.1,"wins":6,"losses":5,"netRtg":1.6,"rank":13},{"team":"LAC","power":43.9,"wins":5,"losses":4,"netRtg":0.9,"rank":14},{"team":"TOR","power":43.4,"wins":7,"losses":6,"netRtg":0.2,"rank":15},{"team":"POR","power":40.9,"wins":5,"losses":6,"netRtg":0.4,"rank":16},{"team":"DAL","power":39.5,"wins":5,"losses":6,"netRtg":-0.5,"rank":17},{"team":"CHA","power":39.4,"wins":5,"losses":7,"netRtg":0.4,"rank":18},{"team":"MIA","power":36.6,"wins":4,"losses":8,"netRtg":0.0,"rank":19},{"team":"CLE","power":36.5,"wins":5,"losses":6,"netRtg":-1.7,"rank":20},{"team":"LAL","power":34.3,"wins":7,"losses":7,"netRtg":-2.3,"rank":21},{"team":"MIN","power":31.4,"wins":4,"losses":7,"netRtg":-1.7,"rank":22},{"team":"ATL","power":31.0,"wins":5,"losses":6,"netRtg":-3.7,"rank":23},{"team":"UTA","power":26.2,"wins":4,"losses":7,"netRtg":-4.4,"rank":24},{"team":"SAC","power":20.8,"wins":3,"losses":8,"netRtg":-5.4,"rank":25},{"team":"IND","power":15.7,"wins":3,"losses":8,"netRtg":-7.5,"rank":26},{"team":"MEM","power":15.1,"wins":4,"losses":9,"netRtg":-7.1,"rank":27},{"team":"WAS","power":6.5,"wins":2,"losses":8,"netRtg":-10.6,"rank":28},{"team":"BKN","power":1.7,"wins":1,"losses":9,"netRtg":-11.8,"rank":29},{"team":"NOP","power":-0.7,"wins":0,"losses":8,"netRtg":-14.8,"rank":30}]},{"date":"2025-11-10","label":"Nov 10","rankings":[{"team":"HOU","power":78.2,"wins":10,"losses":3,"netRtg":9.9,"rank":1},{"team":"SAS","power":78.2,"wins":12,"losses":2,"netRtg":9.6,"rank":2},{"team":"DEN","power":77.0,"wins":10,"losses":3,"netRtg":10.4,"rank":3},{"team":"OKC","power":74.7,"wins":14,"losses":3,"netRtg":8.9,"rank":4},{"team":"NYK","power":64.4,"wins":9,"losses":4,"netRtg":6.6,"rank":5},{"team":"DET","power":61.5,"wins":11,"losses":4,"netRtg":4.7,"rank":6},{"team":"BOS","power":55.5,"wins":8,"losses":7,"netRtg":5.1,"rank":7},{"team":"MIL","power":54.9,"wins":10,"losses":5,"netRtg":2.3,"rank":8},{"team":"ORL","power":53.6,"wins":8,"losses":6,"netRtg":3.9,"rank":9},{"team":"PHX","power":52.7,"wins":9,"losses":6,"netRtg":3.6,"rank":10},{"team":"CHI","power":49.6,"wins":9,"losses":6,"netRtg":0.6,"rank":11},{"team":"TOR","power":49.5,"wins":9,"losses":7,"netRtg":2.0,"rank":12},{"team":"CLE","power":48.9,"wins":8,"losses":7,"netRtg":1.9,"rank":13},{"team":"GSW","power":48.6,"wins":9,"losses":7,"netRtg":2.1,"rank":14},{"team":"PHI","power":45.1,"wins":7,"losses":6,"netRtg":0.8,"rank":15},{"team":"MIN","power":44.7,"wins":7,"losses":8,"netRtg":2.1,"rank":16},{"team":"MIA","power":42.8,"wins":7,"losses":9,"netRtg":0.9,"rank":17},{"team":"ATL","power":40.7,"wins":8,"losses":7,"netRtg":-1.0,"rank":18},{"team":"POR","power":39.0,"wins":6,"losses":8,"netRtg":-0.1,"rank":19},{"team":"LAL","power":36.2,"wins":9,"losses":8,"netRtg":-2.4,"rank":20},{"team":"DAL","power":33.9,"wins":6,"losses":9,"netRtg":-1.1,"rank":21},{"team":"CHA","power":29.8,"wins":5,"losses":10,"netRtg":-1.8,"rank":22},{"team":"LAC","power":29.1,"wins":5,"losses":8,"netRtg":-2.9,"rank":23},{"team":"MEM","power":17.7,"wins":5,"losses":11,"netRtg":-6.7,"rank":24},{"team":"SAC","power":14.4,"wins":4,"losses":10,"netRtg":-8.0,"rank":25},{"team":"UTA","power":14.4,"wins":4,"losses":10,"netRtg":-7.6,"rank":26},{"team":"IND","power":6.4,"wins":3,"losses":11,"netRtg":-10.0,"rank":27},{"team":"NOP","power":4.8,"wins":2,"losses":10,"netRtg":-11.8,"rank":28},{"team":"BKN","power":3.8,"wins":2,"losses":11,"netRtg":-12.5,"rank":29},{"team":"WAS","power":3.7,"wins":2,"losses":12,"netRtg":-12.6,"rank":30}]},{"date":"2025-11-17","label":"Nov 17","rankings":[{"team":"HOU","power":79.9,"wins":13,"losses":3,"netRtg":11.2,"rank":1},{"team":"OKC","power":78.5,"wins":18,"losses":3,"netRtg":11.1,"rank":2},{"team":"DEN","power":76.7,"wins":13,"losses":4,"netRtg":10.1,"rank":3},{"team":"SAS","power":71.5,"wins":13,"losses":4,"netRtg":8.3,"rank":4},{"team":"DET","power":66.3,"wins":14,"losses":4,"netRtg":5.9,"rank":5},{"team":"BOS","power":59.4,"wins":10,"losses":8,"netRtg":6.3,"rank":6},{"team":"NYK","power":59.1,"wins":11,"losses":6,"netRtg":5.2,"rank":7},{"team":"PHX","power":57.5,"wins":11,"losses":7,"netRtg":5.3,"rank":8},{"team":"TOR","power":56.6,"wins":13,"losses":7,"netRtg":3.8,"rank":9},{"team":"ORL","power":55.9,"wins":10,"losses":7,"netRtg":4.4,"rank":10},{"team":"CLE","power":52.2,"wins":11,"losses":8,"netRtg":2.6,"rank":11},{"team":"ATL","power":50.6,"wins":11,"losses":7,"netRtg":1.7,"rank":12},{"team":"GSW","power":49.3,"wins":12,"losses":8,"netRtg":1.6,"rank":13},{"team":"MIN","power":48.8,"wins":9,"losses":9,"netRtg":3.3,"rank":14},{"team":"CHI","power":46.2,"wins":10,"losses":8,"netRtg":-0.1,"rank":15},{"team":"MIL","power":45.3,"wins":11,"losses":8,"netRtg":0.1,"rank":16},{"team":"PHI","power":45.2,"wins":9,"losses":7,"netRtg":0.3,"rank":17},{"team":"LAL","power":39.0,"wins":11,"losses":9,"netRtg":-1.6,"rank":18},{"team":"MIA","power":39.0,"wins":8,"losses":11,"netRtg":-0.3,"rank":19},{"team":"POR","power":35.4,"wins":7,"losses":10,"netRtg":-1.4,"rank":20},{"team":"DAL","power":28.8,"wins":7,"losses":12,"netRtg":-2.7,"rank":21},{"team":"CHA","power":28.6,"wins":6,"losses":13,"netRtg":-2.3,"rank":22},{"team":"LAC","power":28.3,"wins":6,"losses":11,"netRtg":-3.0,"rank":23},{"team":"UTA","power":23.1,"wins":6,"losses":11,"netRtg":-5.2,"rank":24},{"team":"MEM","power":11.2,"wins":5,"losses":14,"netRtg":-8.6,"rank":25},{"team":"SAC","power":7.2,"wins":4,"losses":14,"netRtg":-10.3,"rank":26},{"team":"BKN","power":5.4,"wins":3,"losses":13,"netRtg":-9.8,"rank":27},{"team":"IND","power":4.5,"wins":3,"losses":15,"netRtg":-12.9,"rank":28},{"team":"NOP","power":2.9,"wins":2,"losses":14,"netRtg":-12.4,"rank":29},{"team":"WAS","power":2.8,"wins":2,"losses":14,"netRtg":-13.9,"rank":30}]},{"date":"2025-11-24","label":"Nov 24","rankings":[{"team":"HOU","power":79.3,"wins":15,"losses":4,"netRtg":11.0,"rank":1},{"team":"OKC","power":79.1,"wins":21,"losses":3,"netRtg":12.8,"rank":2},{"team":"DEN","power":73.6,"wins":16,"losses":5,"netRtg":8.9,"rank":3},{"team":"SAS","power":69.6,"wins":15,"losses":5,"netRtg":7.5,"rank":4},{"team":"DET","power":68.4,"wins":17,"losses":4,"netRtg":6.3,"rank":5},{"team":"TOR","power":63.1,"wins":17,"losses":7,"netRtg":5.6,"rank":6},{"team":"ORL","power":60.1,"wins":13,"losses":8,"netRtg":5.4,"rank":7},{"team":"BOS","power":59.3,"wins":12,"losses":9,"netRtg":6.1,"rank":8},{"team":"NYK","power":57.6,"wins":13,"losses":7,"netRtg":4.5,"rank":9},{"team":"PHX","power":57.3,"wins":14,"losses":8,"netRtg":4.6,"rank":10},{"team":"CLE","power":51.0,"wins":13,"losses":10,"netRtg":2.4,"rank":11},{"team":"MIA","power":49.9,"wins":12,"losses":11,"netRtg":2.6,"rank":12},{"team":"ATL","power":49.6,"wins":13,"losses":9,"netRtg":1.5,"rank":13},{"team":"MIN","power":46.9,"wins":10,"losses":11,"netRtg":3.0,"rank":14},{"team":"GSW","power":45.5,"wins":13,"losses":11,"netRtg":1.0,"rank":15},{"team":"PHI","power":42.7,"wins":10,"losses":9,"netRtg":-0.3,"rank":16},{"team":"LAL","power":42.5,"wins":13,"losses":9,"netRtg":-0.7,"rank":17},{"team":"CHI","power":39.1,"wins":12,"losses":10,"netRtg":-2.2,"rank":18},{"team":"MIL","power":38.4,"wins":11,"losses":11,"netRtg":-1.5,"rank":19},{"team":"POR","power":33.0,"wins":9,"losses":13,"netRtg":-2.4,"rank":20},{"team":"DAL","power":27.8,"wins":8,"losses":15,"netRtg":-2.6,"rank":21},{"team":"LAC","power":25.7,"wins":7,"losses":13,"netRtg":-4.0,"rank":22},{"team":"CHA","power":24.3,"wins":6,"losses":16,"netRtg":-3.2,"rank":23},{"team":"MEM","power":19.8,"wins":7,"losses":16,"netRtg":-6.0,"rank":24},{"team":"UTA","power":15.6,"wins":6,"losses":15,"netRtg":-7.3,"rank":25},{"team":"SAC","power":9.1,"wins":6,"losses":16,"netRtg":-10.5,"rank":26},{"team":"BKN","power":7.3,"wins":4,"losses":16,"netRtg":-9.3,"rank":27},{"team":"IND","power":5.3,"wins":4,"losses":17,"netRtg":-11.4,"rank":28},{"team":"NOP","power":3.9,"wins":3,"losses":17,"netRtg":-10.6,"rank":29},{"team":"WAS","power":2.0,"wins":2,"losses":17,"netRtg":-13.9,"rank":30}]},{"date":"2025-12-01","label":"Dec 01","rankings":[{"team":"OKC","power":80.1,"wins":24,"losses":3,"netRtg":12.1,"rank":1},{"team":"HOU","power":78.3,"wins":17,"losses":5,"netRtg":10.6,"rank":2},{"team":"DEN","power":69.4,"wins":17,"losses":7,"netRtg":8.0,"rank":3},{"team":"SAS","power":67.3,"wins":17,"losses":6,"netRtg":6.7,"rank":4},{"team":"ORL","power":65.7,"wins":16,"losses":8,"netRtg":6.8,"rank":5},{"team":"NYK","power":64.8,"wins":16,"losses":7,"netRtg":6.5,"rank":6},{"team":"DET","power":64.4,"wins":19,"losses":6,"netRtg":5.2,"rank":7},{"team":"BOS","power":58.4,"wins":14,"losses":10,"netRtg":5.4,"rank":8},{"team":"TOR","power":57.2,"wins":18,"losses":9,"netRtg":4.0,"rank":9},{"team":"PHX","power":55.9,"wins":16,"losses":10,"netRtg":4.2,"rank":10},{"team":"MIA","power":51.6,"wins":14,"losses":12,"netRtg":2.9,"rank":11},{"team":"CLE","power":49.7,"wins":14,"losses":12,"netRtg":2.4,"rank":12},{"team":"MIN","power":48.8,"wins":12,"losses":12,"netRtg":3.0,"rank":13},{"team":"ATL","power":47.9,"wins":15,"losses":11,"netRtg":1.1,"rank":14},{"team":"LAL","power":45.8,"wins":16,"losses":10,"netRtg":0.3,"rank":15},{"team":"GSW","power":45.3,"wins":14,"losses":12,"netRtg":1.1,"rank":16},{"team":"PHI","power":37.4,"wins":11,"losses":11,"netRtg":-1.9,"rank":17},{"team":"MIL","power":37.1,"wins":12,"losses":14,"netRtg":-1.2,"rank":18},{"team":"CHI","power":35.2,"wins":12,"losses":13,"netRtg":-2.5,"rank":19},{"team":"DAL","power":30.9,"wins":10,"losses":16,"netRtg":-2.2,"rank":20},{"team":"POR","power":30.3,"wins":9,"losses":15,"netRtg":-3.0,"rank":21},{"team":"MEM","power":25.7,"wins":10,"losses":16,"netRtg":-4.6,"rank":22},{"team":"CHA","power":24.6,"wins":8,"losses":18,"netRtg":-3.8,"rank":23},{"team":"LAC","power":20.3,"wins":7,"losses":17,"netRtg":-5.1,"rank":24},{"team":"UTA","power":18.7,"wins":8,"losses":16,"netRtg":-6.9,"rank":25},{"team":"IND","power":9.6,"wins":6,"losses":19,"netRtg":-8.9,"rank":26},{"team":"BKN","power":8.9,"wins":5,"losses":18,"netRtg":-8.8,"rank":27},{"team":"SAC","power":7.3,"wins":6,"losses":19,"netRtg":-10.4,"rank":28},{"team":"WAS","power":4.7,"wins":4,"losses":18,"netRtg":-12.5,"rank":29},{"team":"NOP","power":2.9,"wins":3,"losses":20,"netRtg":-10.3,"rank":30}]},{"date":"2025-12-08","label":"Dec 08","rankings":[{"team":"OKC","power":80.8,"wins":27,"losses":3,"netRtg":13.0,"rank":1},{"team":"HOU","power":77.4,"wins":19,"losses":6,"netRtg":10.6,"rank":2},{"team":"DEN","power":70.7,"wins":20,"losses":7,"netRtg":8.0,"rank":3},{"team":"NYK","power":67.3,"wins":19,"losses":8,"netRtg":7.4,"rank":4},{"team":"BOS","power":66.2,"wins":18,"losses":10,"netRtg":7.5,"rank":5},{"team":"SAS","power":64.7,"wins":20,"losses":7,"netRtg":5.7,"rank":6},{"team":"DET","power":63.8,"wins":21,"losses":7,"netRtg":5.1,"rank":7},{"team":"ORL","power":61.9,"wins":17,"losses":10,"netRtg":5.7,"rank":8},{"team":"PHX","power":53.8,"wins":17,"losses":11,"netRtg":3.3,"rank":9},{"team":"TOR","power":51.3,"wins":19,"losses":12,"netRtg":2.4,"rank":10},{"team":"MIN","power":50.3,"wins":15,"losses":13,"netRtg":3.2,"rank":11},{"team":"CLE","power":47.7,"wins":15,"losses":14,"netRtg":2.0,"rank":12},{"team":"GSW","power":46.9,"wins":16,"losses":14,"netRtg":1.7,"rank":13},{"team":"MIA","power":45.9,"wins":14,"losses":15,"netRtg":1.7,"rank":14},{"team":"ATL","power":45.5,"wins":16,"losses":13,"netRtg":0.7,"rank":15},{"team":"LAL","power":45.0,"wins":18,"losses":11,"netRtg":-0.2,"rank":16},{"team":"PHI","power":42.2,"wins":14,"losses":12,"netRtg":-0.4,"rank":17},{"team":"MIL","power":35.1,"wins":13,"losses":16,"netRtg":-1.9,"rank":18},{"team":"DAL","power":33.3,"wins":12,"losses":17,"netRtg":-1.9,"rank":19},{"team":"MEM","power":30.1,"wins":12,"losses":17,"netRtg":-3.2,"rank":20},{"team":"POR","power":28.8,"wins":10,"losses":18,"netRtg":-3.3,"rank":21},{"team":"CHI","power":28.1,"wins":12,"losses":16,"netRtg":-4.3,"rank":22},{"team":"CHA","power":26.0,"wins":9,"losses":20,"netRtg":-3.3,"rank":23},{"team":"LAC","power":22.9,"wins":8,"losses":19,"netRtg":-4.1,"rank":24},{"team":"UTA","power":16.1,"wins":9,"losses":18,"netRtg":-8.0,"rank":25},{"team":"IND","power":14.7,"wins":8,"losses":20,"netRtg":-7.5,"rank":26},{"team":"BKN","power":14.4,"wins":7,"losses":19,"netRtg":-7.2,"rank":27},{"team":"SAC","power":7.6,"wins":7,"losses":21,"netRtg":-10.0,"rank":28},{"team":"WAS","power":3.8,"wins":4,"losses":21,"netRtg":-14.2,"rank":29},{"team":"NOP","power":2.2,"wins":3,"losses":24,"netRtg":-10.2,"rank":30}]},{"date":"2025-12-15","label":"Dec 15","rankings":[{"team":"OKC","power":80.2,"wins":28,"losses":4,"netRtg":13.7,"rank":1},{"team":"HOU","power":76.2,"wins":20,"losses":7,"netRtg":9.8,"rank":2},{"team":"DEN","power":73.0,"wins":22,"losses":7,"netRtg":8.6,"rank":3},{"team":"NYK","power":69.6,"wins":21,"losses":8,"netRtg":7.8,"rank":4},{"team":"DET","power":66.6,"wins":23,"losses":7,"netRtg":5.9,"rank":5},{"team":"SAS","power":66.2,"wins":22,"losses":7,"netRtg":5.8,"rank":6},{"team":"BOS","power":61.6,"wins":18,"losses":12,"netRtg":6.2,"rank":7},{"team":"ORL","power":60.3,"wins":18,"losses":11,"netRtg":5.2,"rank":8},{"team":"MIN","power":52.7,"wins":17,"losses":13,"netRtg":3.7,"rank":9},{"team":"TOR","power":50.3,"wins":20,"losses":13,"netRtg":2.1,"rank":10},{"team":"PHX","power":47.7,"wins":17,"losses":13,"netRtg":1.4,"rank":11},{"team":"CLE","power":46.6,"wins":16,"losses":15,"netRtg":1.7,"rank":12},{"team":"GSW","power":44.5,"wins":16,"losses":16,"netRtg":1.2,"rank":13},{"team":"LAL","power":44.1,"wins":19,"losses":12,"netRtg":-0.6,"rank":14},{"team":"ATL","power":43.5,"wins":17,"losses":14,"netRtg":-0.2,"rank":15},{"team":"MIA","power":42.9,"wins":14,"losses":17,"netRtg":1.0,"rank":16},{"team":"PHI","power":42.6,"wins":15,"losses":13,"netRtg":-0.1,"rank":17},{"team":"DAL","power":33.8,"wins":13,"losses":18,"netRtg":-1.7,"rank":18},{"team":"MIL","power":32.9,"wins":14,"losses":17,"netRtg":-2.7,"rank":19},{"team":"MEM","power":31.8,"wins":13,"losses":18,"netRtg":-2.6,"rank":20},{"team":"CHI","power":28.2,"wins":13,"losses":17,"netRtg":-4.2,"rank":21},{"team":"POR","power":28.0,"wins":11,"losses":19,"netRtg":-3.7,"rank":22},{"team":"CHA","power":27.5,"wins":10,"losses":21,"netRtg":-3.0,"rank":23},{"team":"LAC","power":21.0,"wins":8,"losses":21,"netRtg":-4.5,"rank":24},{"team":"UTA","power":20.1,"wins":11,"losses":18,"netRtg":-7.1,"rank":25},{"team":"BKN","power":19.6,"wins":8,"losses":20,"netRtg":-5.4,"rank":26},{"team":"IND","power":12.5,"wins":8,"losses":22,"netRtg":-8.0,"rank":27},{"team":"NOP","power":8.7,"wins":5,"losses":24,"netRtg":-8.3,"rank":28},{"team":"SAC","power":7.0,"wins":7,"losses":23,"netRtg":-10.9,"rank":29},{"team":"WAS","power":4.6,"wins":5,"losses":22,"netRtg":-12.6,"rank":30}]},{"date":"2025-12-22","label":"Dec 22","rankings":[{"team":"OKC","power":79.5,"wins":30,"losses":5,"netRtg":13.4,"rank":1},{"team":"DEN","power":72.5,"wins":24,"losses":8,"netRtg":8.4,"rank":2},{"team":"HOU","power":72.5,"wins":21,"losses":9,"netRtg":9.1,"rank":3},{"team":"SAS","power":68.3,"wins":25,"losses":8,"netRtg":6.7,"rank":4},{"team":"NYK","power":68.2,"wins":24,"losses":9,"netRtg":7.2,"rank":5},{"team":"DET","power":67.0,"wins":25,"losses":8,"netRtg":6.4,"rank":6},{"team":"BOS","power":64.2,"wins":21,"losses":12,"netRtg":6.8,"rank":7},{"team":"ORL","power":55.6,"wins":19,"losses":13,"netRtg":3.7,"rank":8},{"team":"MIN","power":52.6,"wins":19,"losses":14,"netRtg":3.4,"rank":9},{"team":"PHX","power":47.0,"wins":18,"losses":14,"netRtg":1.2,"rank":10},{"team":"TOR","power":47.0,"wins":21,"losses":15,"netRtg":1.2,"rank":11},{"team":"GSW","power":46.7,"wins":18,"losses":17,"netRtg":1.9,"rank":12},{"team":"PHI","power":45.3,"wins":17,"losses":13,"netRtg":0.4,"rank":13},{"team":"CLE","power":44.1,"wins":17,"losses":17,"netRtg":1.0,"rank":14},{"team":"LAL","power":43.2,"wins":20,"losses":13,"netRtg":-0.8,"rank":15},{"team":"MIA","power":41.6,"wins":15,"losses":19,"netRtg":0.6,"rank":16},{"team":"ATL","power":38.9,"wins":17,"losses":17,"netRtg":-1.2,"rank":17},{"team":"CHI","power":33.6,"wins":16,"losses":17,"netRtg":-3.0,"rank":18},{"team":"DAL","power":33.1,"wins":14,"losses":20,"netRtg":-1.9,"rank":19},{"team":"MIL","power":31.6,"wins":14,"losses":19,"netRtg":-2.8,"rank":20},{"team":"MEM","power":30.8,"wins":14,"losses":20,"netRtg":-2.9,"rank":21},{"team":"POR","power":29.5,"wins":13,"losses":20,"netRtg":-3.4,"rank":22},{"team":"CHA","power":26.3,"wins":11,"losses":23,"netRtg":-3.5,"rank":23},{"team":"LAC","power":22.0,"wins":9,"losses":22,"netRtg":-4.4,"rank":24},{"team":"BKN","power":21.2,"wins":9,"losses":21,"netRtg":-4.9,"rank":25},{"team":"UTA","power":18.0,"wins":11,"losses":21,"netRtg":-7.4,"rank":26},{"team":"NOP","power":16.0,"wins":8,"losses":24,"netRtg":-6.6,"rank":27},{"team":"IND","power":11.1,"wins":8,"losses":25,"netRtg":-8.1,"rank":28},{"team":"SAC","power":7.1,"wins":8,"losses":25,"netRtg":-10.0,"rank":29},{"team":"WAS","power":5.2,"wins":6,"losses":24,"netRtg":-12.2,"rank":30}]},{"date":"2025-12-29","label":"Dec 29","rankings":[{"team":"OKC","power":78.6,"wins":32,"losses":7,"netRtg":12.1,"rank":1},{"team":"HOU","power":71.8,"wins":24,"losses":10,"netRtg":8.8,"rank":2},{"team":"DEN","power":66.7,"wins":25,"losses":11,"netRtg":6.9,"rank":3},{"team":"NYK","power":66.4,"wins":27,"losses":10,"netRtg":6.4,"rank":4},{"team":"SAS","power":66.4,"wins":27,"losses":10,"netRtg":6.2,"rank":5},{"team":"DET","power":63.7,"wins":26,"losses":10,"netRtg":5.7,"rank":6},{"team":"BOS","power":63.6,"wins":22,"losses":13,"netRtg":6.7,"rank":7},{"team":"MIN","power":53.4,"wins":21,"losses":16,"netRtg":3.7,"rank":8},{"team":"ORL","power":53.2,"wins":21,"losses":15,"netRtg":3.0,"rank":9},{"team":"PHX","power":52.0,"wins":22,"losses":14,"netRtg":2.6,"rank":10},{"team":"TOR","power":48.4,"wins":24,"losses":16,"netRtg":1.5,"rank":11},{"team":"GSW","power":47.4,"wins":20,"losses":18,"netRtg":1.9,"rank":12},{"team":"MIA","power":45.6,"wins":18,"losses":20,"netRtg":1.7,"rank":13},{"team":"CLE","power":45.2,"wins":19,"losses":19,"netRtg":1.3,"rank":14},{"team":"LAL","power":41.1,"wins":21,"losses":15,"netRtg":-1.3,"rank":15},{"team":"PHI","power":40.1,"wins":17,"losses":16,"netRtg":-0.8,"rank":16},{"team":"ATL","power":35.3,"wins":17,"losses":21,"netRtg":-1.9,"rank":17},{"team":"MIL","power":34.4,"wins":17,"losses":20,"netRtg":-2.1,"rank":18},{"team":"MEM","power":33.8,"wins":16,"losses":21,"netRtg":-1.9,"rank":19},{"team":"CHI","power":32.0,"wins":18,"losses":19,"netRtg":-3.6,"rank":20},{"team":"DAL","power":31.8,"wins":15,"losses":23,"netRtg":-2.2,"rank":21},{"team":"POR","power":29.9,"wins":15,"losses":22,"netRtg":-3.4,"rank":22},{"team":"CHA","power":29.5,"wins":13,"losses":24,"netRtg":-2.6,"rank":23},{"team":"LAC","power":29.3,"wins":12,"losses":22,"netRtg":-2.6,"rank":24},{"team":"BKN","power":24.6,"wins":11,"losses":22,"netRtg":-4.1,"rank":25},{"team":"UTA","power":21.3,"wins":13,"losses":22,"netRtg":-6.6,"rank":26},{"team":"NOP","power":13.7,"wins":8,"losses":28,"netRtg":-7.1,"rank":27},{"team":"IND","power":7.7,"wins":8,"losses":29,"netRtg":-9.1,"rank":28},{"team":"SAC","power":7.5,"wins":9,"losses":27,"netRtg":-9.9,"rank":29},{"team":"WAS","power":6.4,"wins":8,"losses":26,"netRtg":-11.0,"rank":30}]},{"date":"2026-01-05","label":"Jan 05","rankings":[{"team":"OKC","power":77.4,"wins":34,"losses":9,"netRtg":11.8,"rank":1},{"team":"HOU","power":71.1,"wins":26,"losses":11,"netRtg":8.6,"rank":2},{"team":"BOS","power":67.7,"wins":26,"losses":13,"netRtg":7.8,"rank":3},{"team":"DET","power":66.0,"wins":29,"losses":11,"netRtg":6.4,"rank":4},{"team":"SAS","power":65.2,"wins":29,"losses":11,"netRtg":6.0,"rank":5},{"team":"DEN","power":63.3,"wins":27,"losses":13,"netRtg":5.9,"rank":6},{"team":"NYK","power":58.9,"wins":27,"losses":14,"netRtg":4.4,"rank":7},{"team":"MIN","power":53.5,"wins":23,"losses":17,"netRtg":3.8,"rank":8},{"team":"ORL","power":52.7,"wins":23,"losses":16,"netRtg":2.8,"rank":9},{"team":"PHX","power":51.7,"wins":24,"losses":16,"netRtg":2.6,"rank":10},{"team":"TOR","power":50.4,"wins":26,"losses":17,"netRtg":2.1,"rank":11},{"team":"CLE","power":46.8,"wins":21,"losses":20,"netRtg":1.6,"rank":12},{"team":"MIA","power":46.7,"wins":20,"losses":21,"netRtg":2.0,"rank":13},{"team":"GSW","power":45.5,"wins":22,"losses":20,"netRtg":1.2,"rank":14},{"team":"PHI","power":43.5,"wins":20,"losses":17,"netRtg":0.0,"rank":15},{"team":"LAL","power":41.1,"wins":23,"losses":16,"netRtg":-1.5,"rank":16},{"team":"MIL","power":36.3,"wins":19,"losses":21,"netRtg":-1.5,"rank":17},{"team":"ATL","power":36.2,"wins":19,"losses":23,"netRtg":-1.7,"rank":18},{"team":"LAC","power":33.3,"wins":15,"losses":23,"netRtg":-1.6,"rank":19},{"team":"CHA","power":32.7,"wins":15,"losses":26,"netRtg":-1.6,"rank":20},{"team":"CHI","power":32.6,"wins":20,"losses":21,"netRtg":-3.3,"rank":21},{"team":"POR","power":32.6,"wins":18,"losses":23,"netRtg":-2.8,"rank":22},{"team":"MEM","power":32.1,"wins":16,"losses":24,"netRtg":-2.2,"rank":23},{"team":"DAL","power":31.7,"wins":16,"losses":24,"netRtg":-2.3,"rank":24},{"team":"BKN","power":23.3,"wins":12,"losses":24,"netRtg":-4.6,"rank":25},{"team":"UTA","power":17.7,"wins":13,"losses":26,"netRtg":-7.4,"rank":26},{"team":"NOP","power":11.1,"wins":8,"losses":31,"netRtg":-7.8,"rank":27},{"team":"IND","power":7.7,"wins":8,"losses":32,"netRtg":-8.9,"rank":28},{"team":"WAS","power":7.7,"wins":10,"losses":27,"netRtg":-10.2,"rank":29},{"team":"SAC","power":6.1,"wins":9,"losses":31,"netRtg":-11.4,"rank":30}]},{"date":"2026-01-12","label":"Jan 12","rankings":[{"team":"OKC","power":78.1,"wins":37,"losses":9,"netRtg":11.4,"rank":1},{"team":"HOU","power":66.0,"wins":26,"losses":14,"netRtg":7.5,"rank":2},{"team":"DET","power":65.2,"wins":30,"losses":12,"netRtg":6.3,"rank":3},{"team":"SAS","power":64.3,"wins":31,"losses":13,"netRtg":5.8,"rank":4},{"team":"BOS","power":64.2,"wins":27,"losses":16,"netRtg":7.0,"rank":5},{"team":"DEN","power":61.4,"wins":29,"losses":14,"netRtg":5.1,"rank":6},{"team":"NYK","power":59.0,"wins":29,"losses":15,"netRtg":4.5,"rank":7},{"team":"MIN","power":55.0,"wins":26,"losses":18,"netRtg":4.0,"rank":8},{"team":"PHX","power":54.8,"wins":27,"losses":16,"netRtg":3.4,"rank":9},{"team":"ORL","power":50.8,"wins":25,"losses":18,"netRtg":2.4,"rank":10},{"team":"TOR","power":48.5,"wins":28,"losses":19,"netRtg":1.5,"rank":11},{"team":"GSW","power":47.2,"wins":24,"losses":21,"netRtg":1.8,"rank":12},{"team":"PHI","power":47.0,"wins":23,"losses":18,"netRtg":1.1,"rank":13},{"team":"CLE","power":46.0,"wins":23,"losses":22,"netRtg":1.4,"rank":14},{"team":"MIA","power":41.3,"wins":20,"losses":24,"netRtg":0.4,"rank":15},{"team":"ATL","power":40.8,"wins":22,"losses":23,"netRtg":-0.4,"rank":16},{"team":"LAL","power":38.7,"wins":24,"losses":19,"netRtg":-1.9,"rank":17},{"team":"LAC","power":36.1,"wins":18,"losses":24,"netRtg":-1.0,"rank":18},{"team":"MIL","power":35.8,"wins":20,"losses":23,"netRtg":-1.6,"rank":19},{"team":"CHA","power":34.9,"wins":16,"losses":29,"netRtg":-0.4,"rank":20},{"team":"POR","power":33.7,"wins":20,"losses":24,"netRtg":-2.7,"rank":21},{"team":"CHI","power":33.3,"wins":21,"losses":22,"netRtg":-3.1,"rank":22},{"team":"MEM","power":32.3,"wins":18,"losses":26,"netRtg":-2.3,"rank":23},{"team":"DAL","power":31.7,"wins":18,"losses":26,"netRtg":-2.3,"rank":24},{"team":"BKN","power":21.0,"wins":12,"losses":28,"netRtg":-4.9,"rank":25},{"team":"UTA","power":17.3,"wins":15,"losses":28,"netRtg":-7.7,"rank":26},{"team":"IND","power":12.9,"wins":11,"losses":33,"netRtg":-7.5,"rank":27},{"team":"NOP","power":12.1,"wins":9,"losses":34,"netRtg":-7.4,"rank":28},{"team":"WAS","power":7.5,"wins":11,"losses":30,"netRtg":-10.5,"rank":29},{"team":"SAC","power":7.1,"wins":11,"losses":33,"netRtg":-10.6,"rank":30}]},{"date":"2026-01-19","label":"Jan 19","rankings":[{"team":"OKC","power":78.3,"wins":40,"losses":10,"netRtg":11.9,"rank":1},{"team":"DET","power":67.5,"wins":33,"losses":12,"netRtg":6.9,"rank":2},{"team":"BOS","power":64.8,"wins":29,"losses":17,"netRtg":7.2,"rank":3},{"team":"HOU","power":64.8,"wins":29,"losses":15,"netRtg":6.8,"rank":4},{"team":"SAS","power":63.9,"wins":34,"losses":14,"netRtg":5.6,"rank":5},{"team":"DEN","power":60.2,"wins":32,"losses":15,"netRtg":4.6,"rank":6},{"team":"MIN","power":55.2,"wins":27,"losses":20,"netRtg":4.3,"rank":7},{"team":"PHX","power":54.1,"wins":29,"losses":18,"netRtg":3.3,"rank":8},{"team":"NYK","power":53.2,"wins":29,"losses":19,"netRtg":3.1,"rank":9},{"team":"GSW","power":52.5,"wins":28,"losses":21,"netRtg":3.2,"rank":10},{"team":"ORL","power":49.7,"wins":26,"losses":19,"netRtg":2.0,"rank":11},{"team":"TOR","power":47.2,"wins":29,"losses":21,"netRtg":1.3,"rank":12},{"team":"CLE","power":46.1,"wins":25,"losses":23,"netRtg":1.2,"rank":13},{"team":"PHI","power":44.9,"wins":24,"losses":20,"netRtg":0.6,"rank":14},{"team":"MIA","power":40.6,"wins":22,"losses":26,"netRtg":-0.1,"rank":15},{"team":"LAL","power":39.4,"wins":26,"losses":21,"netRtg":-1.6,"rank":16},{"team":"LAC","power":38.9,"wins":21,"losses":24,"netRtg":-0.4,"rank":17},{"team":"CHA","power":36.9,"wins":18,"losses":30,"netRtg":0.0,"rank":18},{"team":"POR","power":36.2,"wins":23,"losses":25,"netRtg":-2.1,"rank":19},{"team":"DAL","power":35.9,"wins":21,"losses":27,"netRtg":-1.1,"rank":20},{"team":"ATL","power":35.6,"wins":22,"losses":27,"netRtg":-1.8,"rank":21},{"team":"CHI","power":34.6,"wins":23,"losses":24,"netRtg":-2.5,"rank":22},{"team":"MEM","power":33.3,"wins":19,"losses":27,"netRtg":-2.0,"rank":23},{"team":"MIL","power":33.1,"wins":21,"losses":25,"netRtg":-2.5,"rank":24},{"team":"BKN","power":20.0,"wins":13,"losses":31,"netRtg":-5.2,"rank":25},{"team":"UTA","power":14.9,"wins":15,"losses":32,"netRtg":-8.3,"rank":26},{"team":"NOP","power":12.7,"wins":10,"losses":37,"netRtg":-7.2,"rank":27},{"team":"IND","power":11.4,"wins":12,"losses":36,"netRtg":-8.1,"rank":28},{"team":"SAC","power":9.2,"wins":13,"losses":34,"netRtg":-9.6,"rank":29},{"team":"WAS","power":6.3,"wins":11,"losses":34,"netRtg":-10.4,"rank":30}]},{"date":"2026-01-26","label":"Jan 26","rankings":[{"team":"OKC","power":77.1,"wins":41,"losses":12,"netRtg":11.5,"rank":1},{"team":"DET","power":67.5,"wins":35,"losses":13,"netRtg":7.0,"rank":2},{"team":"BOS","power":64.8,"wins":32,"losses":18,"netRtg":7.1,"rank":3},{"team":"HOU","power":64.5,"wins":32,"losses":16,"netRtg":6.6,"rank":4},{"team":"SAS","power":62.2,"wins":35,"losses":16,"netRtg":5.4,"rank":5},{"team":"DEN","power":59.5,"wins":34,"losses":16,"netRtg":4.4,"rank":6},{"team":"NYK","power":56.3,"wins":31,"losses":19,"netRtg":4.1,"rank":7},{"team":"MIN","power":52.7,"wins":28,"losses":23,"netRtg":3.7,"rank":8},{"team":"PHX","power":52.4,"wins":30,"losses":20,"netRtg":2.9,"rank":9},{"team":"TOR","power":50.4,"wins":33,"losses":21,"netRtg":2.0,"rank":10},{"team":"GSW","power":49.7,"wins":29,"losses":24,"netRtg":2.5,"rank":11},{"team":"CLE","power":49.2,"wins":29,"losses":23,"netRtg":1.9,"rank":12},{"team":"ORL","power":44.9,"wins":26,"losses":22,"netRtg":0.7,"rank":13},{"team":"MIA","power":43.0,"wins":25,"losses":27,"netRtg":0.6,"rank":14},{"team":"PHI","power":41.8,"wins":25,"losses":23,"netRtg":-0.3,"rank":15},{"team":"LAL","power":41.2,"wins":29,"losses":22,"netRtg":-1.1,"rank":16},{"team":"CHA","power":40.9,"wins":21,"losses":31,"netRtg":1.2,"rank":17},{"team":"LAC","power":40.3,"wins":23,"losses":25,"netRtg":-0.1,"rank":18},{"team":"ATL","power":38.3,"wins":25,"losses":27,"netRtg":-1.2,"rank":19},{"team":"CHI","power":37.3,"wins":26,"losses":25,"netRtg":-1.8,"rank":20},{"team":"DAL","power":36.3,"wins":22,"losses":28,"netRtg":-1.0,"rank":21},{"team":"POR","power":35.9,"wins":24,"losses":27,"netRtg":-2.0,"rank":22},{"team":"MEM","power":31.7,"wins":19,"losses":30,"netRtg":-2.2,"rank":23},{"team":"MIL","power":31.7,"wins":21,"losses":27,"netRtg":-2.9,"rank":24},{"team":"NOP","power":15.3,"wins":12,"losses":38,"netRtg":-6.6,"rank":25},{"team":"BKN","power":15.0,"wins":13,"losses":34,"netRtg":-6.9,"rank":26},{"team":"UTA","power":14.0,"wins":16,"losses":34,"netRtg":-8.6,"rank":27},{"team":"IND","power":11.5,"wins":13,"losses":38,"netRtg":-8.2,"rank":28},{"team":"SAC","power":7.6,"wins":13,"losses":38,"netRtg":-9.9,"rank":29},{"team":"WAS","power":5.9,"wins":11,"losses":36,"netRtg":-10.3,"rank":30}]},{"date":"2026-02-02","label":"Feb 02","rankings":[{"team":"OKC","power":76.9,"wins":43,"losses":13,"netRtg":11.0,"rank":1},{"team":"DET","power":68.4,"wins":38,"losses":14,"netRtg":7.3,"rank":2},{"team":"BOS","power":65.4,"wins":34,"losses":19,"netRtg":7.4,"rank":3},{"team":"HOU","power":64.0,"wins":35,"losses":17,"netRtg":6.3,"rank":4},{"team":"SAS","power":62.1,"wins":37,"losses":17,"netRtg":5.4,"rank":5},{"team":"NYK","power":60.6,"wins":35,"losses":19,"netRtg":5.4,"rank":6},{"team":"DEN","power":58.5,"wins":36,"losses":18,"netRtg":4.2,"rank":7},{"team":"MIN","power":54.2,"wins":31,"losses":24,"netRtg":4.1,"rank":8},{"team":"PHX","power":52.8,"wins":33,"losses":21,"netRtg":2.9,"rank":9},{"team":"CLE","power":50.9,"wins":31,"losses":24,"netRtg":2.5,"rank":10},{"team":"GSW","power":49.9,"wins":30,"losses":25,"netRtg":2.6,"rank":11},{"team":"TOR","power":48.3,"wins":34,"losses":23,"netRtg":1.4,"rank":12},{"team":"ORL","power":45.9,"wins":28,"losses":23,"netRtg":0.9,"rank":13},{"team":"PHI","power":45.4,"wins":29,"losses":23,"netRtg":0.6,"rank":14},{"team":"MIA","power":44.4,"wins":27,"losses":29,"netRtg":1.1,"rank":15},{"team":"CHA","power":43.5,"wins":25,"losses":31,"netRtg":1.6,"rank":16},{"team":"LAC","power":40.8,"wins":25,"losses":27,"netRtg":0.1,"rank":17},{"team":"LAL","power":40.2,"wins":30,"losses":24,"netRtg":-1.2,"rank":18},{"team":"ATL","power":37.6,"wins":26,"losses":29,"netRtg":-1.4,"rank":19},{"team":"CHI","power":34.9,"wins":27,"losses":28,"netRtg":-2.5,"rank":20},{"team":"DAL","power":34.5,"wins":22,"losses":31,"netRtg":-1.3,"rank":21},{"team":"POR","power":32.5,"wins":24,"losses":30,"netRtg":-2.9,"rank":22},{"team":"MEM","power":30.1,"wins":20,"losses":33,"netRtg":-2.6,"rank":23},{"team":"MIL","power":28.4,"wins":21,"losses":30,"netRtg":-3.8,"rank":24},{"team":"NOP","power":15.6,"wins":13,"losses":41,"netRtg":-6.5,"rank":25},{"team":"BKN","power":13.9,"wins":14,"losses":37,"netRtg":-7.3,"rank":26},{"team":"IND","power":13.9,"wins":15,"losses":39,"netRtg":-7.7,"rank":27},{"team":"UTA","power":12.3,"wins":16,"losses":38,"netRtg":-8.8,"rank":28},{"team":"WAS","power":8.1,"wins":14,"losses":37,"netRtg":-9.7,"rank":29},{"team":"SAC","power":6.6,"wins":13,"losses":42,"netRtg":-9.9,"rank":30}]},{"date":"2026-02-09","label":"Feb 09","rankings":[{"team":"OKC","power":76.4,"wins":45,"losses":15,"netRtg":10.8,"rank":1},{"team":"DET","power":68.9,"wins":41,"losses":15,"netRtg":7.4,"rank":2},{"team":"BOS","power":64.9,"wins":37,"losses":20,"netRtg":7.1,"rank":3},{"team":"SAS","power":63.7,"wins":40,"losses":17,"netRtg":5.7,"rank":4},{"team":"HOU","power":61.3,"wins":36,"losses":19,"netRtg":5.5,"rank":5},{"team":"NYK","power":61.1,"wins":38,"losses":20,"netRtg":5.4,"rank":6},{"team":"DEN","power":57.0,"wins":37,"losses":21,"netRtg":4.0,"rank":7},{"team":"MIN","power":53.3,"wins":33,"losses":26,"netRtg":3.8,"rank":8},{"team":"CLE","power":53.2,"wins":34,"losses":24,"netRtg":3.1,"rank":9},{"team":"PHX","power":51.6,"wins":34,"losses":23,"netRtg":2.6,"rank":10},{"team":"TOR","power":49.7,"wins":36,"losses":24,"netRtg":1.9,"rank":11},{"team":"GSW","power":48.4,"wins":32,"losses":27,"netRtg":2.1,"rank":12},{"team":"ORL","power":46.4,"wins":31,"losses":24,"netRtg":0.9,"rank":13},{"team":"PHI","power":45.4,"wins":31,"losses":25,"netRtg":0.6,"rank":14},{"team":"CHA","power":44.4,"wins":27,"losses":32,"netRtg":1.7,"rank":15},{"team":"MIA","power":43.9,"wins":28,"losses":32,"netRtg":1.2,"rank":16},{"team":"LAL","power":41.8,"wins":33,"losses":25,"netRtg":-0.9,"rank":17},{"team":"LAC","power":40.5,"wins":27,"losses":28,"netRtg":-0.1,"rank":18},{"team":"ATL","power":37.2,"wins":28,"losses":31,"netRtg":-1.5,"rank":19},{"team":"POR","power":35.5,"wins":27,"losses":31,"netRtg":-2.0,"rank":20},{"team":"DAL","power":32.5,"wins":22,"losses":34,"netRtg":-1.9,"rank":21},{"team":"CHI","power":31.7,"wins":27,"losses":32,"netRtg":-3.2,"rank":22},{"team":"MIL","power":30.2,"wins":24,"losses":31,"netRtg":-3.4,"rank":23},{"team":"MEM","power":29.1,"wins":21,"losses":36,"netRtg":-2.9,"rank":24},{"team":"NOP","power":18.3,"wins":15,"losses":42,"netRtg":-5.7,"rank":25},{"team":"BKN","power":15.2,"wins":16,"losses":39,"netRtg":-7.1,"rank":26},{"team":"UTA","power":14.6,"wins":18,"losses":40,"netRtg":-8.1,"rank":27},{"team":"IND","power":12.7,"wins":15,"losses":42,"netRtg":-7.8,"rank":28},{"team":"WAS","power":7.4,"wins":15,"losses":40,"netRtg":-10.2,"rank":29},{"team":"SAC","power":5.8,"wins":13,"losses":46,"netRtg":-9.9,"rank":30}]},{"date":"2026-02-16","label":"Feb 16","rankings":[{"team":"OKC","power":76.1,"wins":46,"losses":16,"netRtg":10.6,"rank":1},{"team":"DET","power":69.7,"wins":42,"losses":15,"netRtg":7.6,"rank":2},{"team":"BOS","power":65.7,"wins":38,"losses":20,"netRtg":7.3,"rank":3},{"team":"SAS","power":65.5,"wins":42,"losses":17,"netRtg":6.2,"rank":4},{"team":"NYK","power":62.4,"wins":39,"losses":21,"netRtg":6.0,"rank":5},{"team":"HOU","power":60.7,"wins":37,"losses":20,"netRtg":5.4,"rank":6},{"team":"DEN","power":57.2,"wins":38,"losses":21,"netRtg":4.0,"rank":7},{"team":"CLE","power":54.4,"wins":35,"losses":24,"netRtg":3.4,"rank":8},{"team":"MIN","power":54.4,"wins":34,"losses":26,"netRtg":4.1,"rank":9},{"team":"PHX","power":50.5,"wins":35,"losses":24,"netRtg":2.2,"rank":10},{"team":"TOR","power":48.6,"wins":36,"losses":25,"netRtg":1.5,"rank":11},{"team":"GSW","power":47.5,"wins":32,"losses":28,"netRtg":1.8,"rank":12},{"team":"ORL","power":45.6,"wins":31,"losses":25,"netRtg":0.8,"rank":13},{"team":"CHA","power":44.7,"wins":28,"losses":32,"netRtg":1.8,"rank":14},{"team":"MIA","power":44.6,"wins":29,"losses":32,"netRtg":1.4,"rank":15},{"team":"PHI","power":42.8,"wins":31,"losses":26,"netRtg":-0.3,"rank":16},{"team":"LAL","power":41.4,"wins":34,"losses":26,"netRtg":-1.0,"rank":17},{"team":"LAC","power":40.4,"wins":28,"losses":29,"netRtg":-0.2,"rank":18},{"team":"ATL","power":36.8,"wins":28,"losses":32,"netRtg":-1.6,"rank":19},{"team":"POR","power":35.3,"wins":28,"losses":32,"netRtg":-2.1,"rank":20},{"team":"MIL","power":32.5,"wins":26,"losses":31,"netRtg":-2.8,"rank":21},{"team":"DAL","power":30.9,"wins":22,"losses":36,"netRtg":-2.3,"rank":22},{"team":"CHI","power":30.8,"wins":27,"losses":33,"netRtg":-3.5,"rank":23},{"team":"MEM","power":28.8,"wins":21,"losses":37,"netRtg":-2.9,"rank":24},{"team":"NOP","power":17.8,"wins":15,"losses":43,"netRtg":-5.8,"rank":25},{"team":"UTA","power":15.9,"wins":19,"losses":41,"netRtg":-7.6,"rank":26},{"team":"BKN","power":15.0,"wins":16,"losses":40,"netRtg":-7.0,"rank":27},{"team":"IND","power":14.7,"wins":17,"losses":42,"netRtg":-7.4,"rank":28},{"team":"WAS","power":7.2,"wins":15,"losses":41,"netRtg":-10.5,"rank":29},{"team":"SAC","power":5.3,"wins":13,"losses":47,"netRtg":-10.2,"rank":30}]},{"date":"2026-02-23","label":"Feb 23","rankings":[{"team":"OKC","power":76.4,"wins":48,"losses":16,"netRtg":10.7,"rank":1},{"team":"DET","power":69.5,"wins":44,"losses":16,"netRtg":7.6,"rank":2},{"team":"SAS","power":67.6,"wins":45,"losses":17,"netRtg":6.8,"rank":3},{"team":"BOS","power":66.9,"wins":40,"losses":20,"netRtg":7.6,"rank":4},{"team":"NYK","power":61.5,"wins":41,"losses":22,"netRtg":5.6,"rank":5},{"team":"HOU","power":61.0,"wins":39,"losses":21,"netRtg":5.5,"rank":6},{"team":"DEN","power":57.9,"wins":39,"losses":23,"netRtg":4.5,"rank":7},{"team":"CLE","power":55.1,"wins":37,"losses":25,"netRtg":3.7,"rank":8},{"team":"MIN","power":53.3,"wins":35,"losses":27,"netRtg":3.7,"rank":9},{"team":"TOR","power":50.4,"wins":38,"losses":25,"netRtg":2.1,"rank":10},{"team":"PHX","power":48.2,"wins":36,"losses":26,"netRtg":1.5,"rank":11},{"team":"GSW","power":47.4,"wins":33,"losses":29,"netRtg":1.8,"rank":12},{"team":"ORL","power":47.2,"wins":33,"losses":26,"netRtg":1.3,"rank":13},{"team":"MIA","power":47.0,"wins":31,"losses":32,"netRtg":2.1,"rank":14},{"team":"CHA","power":44.6,"wins":29,"losses":34,"netRtg":1.8,"rank":15},{"team":"PHI","power":42.4,"wins":32,"losses":28,"netRtg":-0.2,"rank":16},{"team":"LAL","power":40.7,"wins":35,"losses":27,"netRtg":-1.2,"rank":17},{"team":"LAC","power":40.0,"wins":29,"losses":31,"netRtg":-0.2,"rank":18},{"team":"ATL","power":36.9,"wins":30,"losses":33,"netRtg":-1.7,"rank":19},{"team":"POR","power":34.0,"wins":29,"losses":33,"netRtg":-2.6,"rank":20},{"team":"MIL","power":32.5,"wins":27,"losses":32,"netRtg":-2.9,"rank":21},{"team":"DAL","power":30.9,"wins":23,"losses":37,"netRtg":-2.3,"rank":22},{"team":"CHI","power":29.3,"wins":27,"losses":36,"netRtg":-3.8,"rank":23},{"team":"MEM","power":28.3,"wins":22,"losses":39,"netRtg":-3.0,"rank":24},{"team":"NOP","power":18.4,"wins":16,"losses":44,"netRtg":-5.7,"rank":25},{"team":"UTA","power":14.9,"wins":19,"losses":43,"netRtg":-7.8,"rank":26},{"team":"IND","power":14.0,"wins":17,"losses":45,"netRtg":-7.5,"rank":27},{"team":"BKN","power":12.8,"wins":16,"losses":43,"netRtg":-7.6,"rank":28},{"team":"WAS","power":8.1,"wins":17,"losses":42,"netRtg":-9.9,"rank":29},{"team":"SAC","power":5.6,"wins":14,"losses":49,"netRtg":-10.4,"rank":30}]},{"date":"2026-03-02","label":"Mar 02","rankings":[{"team":"OKC","power":76.5,"wins":51,"losses":17,"netRtg":10.3,"rank":1},{"team":"DET","power":70.2,"wins":47,"losses":16,"netRtg":7.6,"rank":2},{"team":"BOS","power":68.8,"wins":44,"losses":21,"netRtg":8.2,"rank":3},{"team":"SAS","power":66.4,"wins":47,"losses":18,"netRtg":6.4,"rank":4},{"team":"NYK","power":62.4,"wins":43,"losses":23,"netRtg":5.9,"rank":5},{"team":"HOU","power":61.5,"wins":42,"losses":22,"netRtg":5.6,"rank":6},{"team":"DEN","power":57.3,"wins":41,"losses":25,"netRtg":4.3,"rank":7},{"team":"CLE","power":54.8,"wins":39,"losses":27,"netRtg":3.7,"rank":8},{"team":"MIN","power":54.4,"wins":38,"losses":27,"netRtg":3.8,"rank":9},{"team":"TOR","power":49.7,"wins":39,"losses":27,"netRtg":1.9,"rank":10},{"team":"CHA","power":48.0,"wins":32,"losses":34,"netRtg":2.8,"rank":11},{"team":"PHX","power":47.5,"wins":37,"losses":27,"netRtg":1.2,"rank":12},{"team":"MIA","power":46.2,"wins":32,"losses":34,"netRtg":1.9,"rank":13},{"team":"ORL","power":46.0,"wins":34,"losses":28,"netRtg":1.0,"rank":14},{"team":"GSW","power":45.4,"wins":34,"losses":32,"netRtg":1.3,"rank":15},{"team":"PHI","power":43.2,"wins":34,"losses":29,"netRtg":-0.0,"rank":16},{"team":"LAL","power":42.6,"wins":37,"losses":29,"netRtg":-0.4,"rank":17},{"team":"LAC","power":41.5,"wins":31,"losses":32,"netRtg":0.2,"rank":18},{"team":"ATL","power":41.1,"wins":33,"losses":33,"netRtg":-0.3,"rank":19},{"team":"POR","power":32.1,"wins":30,"losses":36,"netRtg":-3.2,"rank":20},{"team":"MIL","power":30.3,"wins":29,"losses":35,"netRtg":-3.7,"rank":21},{"team":"MEM","power":29.8,"wins":24,"losses":40,"netRtg":-2.6,"rank":22},{"team":"DAL","power":29.5,"wins":24,"losses":40,"netRtg":-2.7,"rank":23},{"team":"CHI","power":28.8,"wins":28,"losses":38,"netRtg":-3.9,"rank":24},{"team":"NOP","power":20.5,"wins":19,"losses":45,"netRtg":-5.2,"rank":25},{"team":"UTA","power":14.2,"wins":19,"losses":46,"netRtg":-7.8,"rank":26},{"team":"IND","power":11.8,"wins":17,"losses":48,"netRtg":-8.1,"rank":27},{"team":"BKN","power":10.8,"wins":16,"losses":47,"netRtg":-8.2,"rank":28},{"team":"WAS","power":7.2,"wins":17,"losses":46,"netRtg":-10.3,"rank":29},{"team":"SAC","power":5.7,"wins":15,"losses":51,"netRtg":-10.7,"rank":30}]},{"date":"2026-03-09","label":"Mar 09","rankings":[{"team":"OKC","power":77.1,"wins":55,"losses":17,"netRtg":10.0,"rank":1},{"team":"SAS","power":69.4,"wins":51,"losses":18,"netRtg":7.2,"rank":2},{"team":"BOS","power":67.8,"wins":46,"losses":22,"netRtg":7.9,"rank":3},{"team":"DET","power":66.1,"wins":47,"losses":20,"netRtg":6.7,"rank":4},{"team":"NYK","power":61.9,"wins":45,"losses":26,"netRtg":5.9,"rank":5},{"team":"HOU","power":59.6,"wins":43,"losses":24,"netRtg":5.1,"rank":6},{"team":"DEN","power":55.2,"wins":42,"losses":27,"netRtg":3.6,"rank":7},{"team":"CLE","power":54.8,"wins":41,"losses":28,"netRtg":3.6,"rank":8},{"team":"MIN","power":53.6,"wins":40,"losses":28,"netRtg":3.5,"rank":9},{"team":"ORL","power":50.0,"wins":38,"losses":28,"netRtg":2.2,"rank":10},{"team":"MIA","power":49.3,"wins":36,"losses":34,"netRtg":2.7,"rank":11},{"team":"TOR","power":49.2,"wins":40,"losses":29,"netRtg":1.9,"rank":12},{"team":"CHA","power":48.9,"wins":34,"losses":36,"netRtg":3.2,"rank":13},{"team":"PHX","power":48.4,"wins":40,"losses":28,"netRtg":1.5,"rank":14},{"team":"GSW","power":44.8,"wins":35,"losses":34,"netRtg":1.1,"rank":15},{"team":"LAL","power":44.0,"wins":40,"losses":30,"netRtg":-0.0,"rank":16},{"team":"LAC","power":43.2,"wins":34,"losses":33,"netRtg":0.6,"rank":17},{"team":"ATL","power":42.7,"wins":35,"losses":33,"netRtg":0.1,"rank":18},{"team":"PHI","power":40.2,"wins":35,"losses":32,"netRtg":-0.9,"rank":19},{"team":"POR","power":33.5,"wins":32,"losses":37,"netRtg":-2.7,"rank":20},{"team":"MIL","power":28.8,"wins":30,"losses":37,"netRtg":-4.1,"rank":21},{"team":"CHI","power":28.3,"wins":29,"losses":40,"netRtg":-4.1,"rank":22},{"team":"MEM","power":28.3,"wins":24,"losses":44,"netRtg":-2.9,"rank":23},{"team":"DAL","power":26.2,"wins":24,"losses":44,"netRtg":-3.7,"rank":24},{"team":"NOP","power":22.4,"wins":21,"losses":47,"netRtg":-4.7,"rank":25},{"team":"UTA","power":15.5,"wins":21,"losses":48,"netRtg":-7.4,"rank":26},{"team":"BKN","power":11.5,"wins":18,"losses":49,"netRtg":-8.1,"rank":27},{"team":"IND","power":10.2,"wins":17,"losses":51,"netRtg":-8.5,"rank":28},{"team":"WAS","power":6.6,"wins":17,"losses":49,"netRtg":-10.5,"rank":29},{"team":"SAC","power":5.9,"wins":16,"losses":53,"netRtg":-10.3,"rank":30}]},{"date":"2026-03-16","label":"Mar 16","rankings":[{"team":"OKC","power":77.3,"wins":57,"losses":17,"netRtg":10.0,"rank":1},{"team":"SAS","power":69.2,"wins":54,"losses":19,"netRtg":7.1,"rank":2},{"team":"DET","power":67.6,"wins":50,"losses":21,"netRtg":7.2,"rank":3},{"team":"BOS","power":66.7,"wins":48,"losses":24,"netRtg":7.5,"rank":4},{"team":"NYK","power":62.8,"wins":48,"losses":26,"netRtg":6.1,"rank":5},{"team":"HOU","power":57.6,"wins":45,"losses":26,"netRtg":4.4,"rank":6},{"team":"DEN","power":56.5,"wins":44,"losses":28,"netRtg":4.0,"rank":7},{"team":"CLE","power":54.6,"wins":42,"losses":30,"netRtg":3.7,"rank":8},{"team":"MIN","power":51.1,"wins":41,"losses":31,"netRtg":2.7,"rank":9},{"team":"ORL","power":50.2,"wins":41,"losses":29,"netRtg":2.1,"rank":10},{"team":"MIA","power":50.0,"wins":38,"losses":35,"netRtg":2.9,"rank":11},{"team":"CHA","power":48.7,"wins":36,"losses":37,"netRtg":3.0,"rank":12},{"team":"PHX","power":48.6,"wins":42,"losses":30,"netRtg":1.6,"rank":13},{"team":"TOR","power":48.6,"wins":42,"losses":31,"netRtg":1.7,"rank":14},{"team":"LAL","power":46.3,"wins":44,"losses":30,"netRtg":0.4,"rank":15},{"team":"ATL","power":45.7,"wins":39,"losses":33,"netRtg":0.9,"rank":16},{"team":"LAC","power":44.0,"wins":36,"losses":35,"netRtg":0.9,"rank":17},{"team":"GSW","power":43.7,"wins":36,"losses":37,"netRtg":0.9,"rank":18},{"team":"PHI","power":40.9,"wins":38,"losses":33,"netRtg":-0.8,"rank":19},{"team":"POR","power":34.6,"wins":34,"losses":39,"netRtg":-2.3,"rank":20},{"team":"CHI","power":29.3,"wins":31,"losses":42,"netRtg":-3.7,"rank":21},{"team":"MIL","power":27.7,"wins":31,"losses":40,"netRtg":-4.4,"rank":22},{"team":"MEM","power":25.9,"wins":24,"losses":48,"netRtg":-3.6,"rank":23},{"team":"DAL","power":25.4,"wins":26,"losses":47,"netRtg":-4.1,"rank":24},{"team":"NOP","power":24.5,"wins":23,"losses":48,"netRtg":-4.1,"rank":25},{"team":"UTA","power":14.6,"wins":21,"losses":51,"netRtg":-7.6,"rank":26},{"team":"BKN","power":9.4,"wins":18,"losses":53,"netRtg":-8.7,"rank":27},{"team":"IND","power":9.4,"wins":17,"losses":55,"netRtg":-8.6,"rank":28},{"team":"SAC","power":7.9,"wins":19,"losses":54,"netRtg":-9.6,"rank":29},{"team":"WAS","power":6.1,"wins":17,"losses":53,"netRtg":-10.6,"rank":30}]},{"date":"2026-03-23","label":"Mar 23","rankings":[{"team":"OKC","power":77.8,"wins":61,"losses":17,"netRtg":10.4,"rank":1},{"team":"SAS","power":71.0,"wins":58,"losses":19,"netRtg":7.6,"rank":2},{"team":"DET","power":68.8,"wins":54,"losses":21,"netRtg":7.5,"rank":3},{"team":"BOS","power":66.4,"wins":50,"losses":25,"netRtg":7.4,"rank":4},{"team":"NYK","power":64.4,"wins":51,"losses":26,"netRtg":6.6,"rank":5},{"team":"DEN","power":57.6,"wins":47,"losses":29,"netRtg":4.4,"rank":6},{"team":"HOU","power":57.0,"wins":47,"losses":28,"netRtg":4.3,"rank":7},{"team":"CLE","power":55.3,"wins":45,"losses":30,"netRtg":3.8,"rank":8},{"team":"MIN","power":52.9,"wins":44,"losses":32,"netRtg":3.3,"rank":9},{"team":"CHA","power":51.6,"wins":39,"losses":37,"netRtg":3.8,"rank":10},{"team":"TOR","power":48.9,"wins":44,"losses":33,"netRtg":1.9,"rank":11},{"team":"PHX","power":48.0,"wins":43,"losses":33,"netRtg":1.6,"rank":12},{"team":"ORL","power":47.8,"wins":41,"losses":33,"netRtg":1.6,"rank":13},{"team":"ATL","power":47.5,"wins":42,"losses":34,"netRtg":1.5,"rank":14},{"team":"LAL","power":47.1,"wins":47,"losses":31,"netRtg":0.6,"rank":15},{"team":"MIA","power":46.6,"wins":38,"losses":39,"netRtg":1.9,"rank":16},{"team":"LAC","power":44.3,"wins":38,"losses":37,"netRtg":1.1,"rank":17},{"team":"GSW","power":41.7,"wins":37,"losses":40,"netRtg":0.3,"rank":18},{"team":"PHI","power":40.3,"wins":40,"losses":35,"netRtg":-1.0,"rank":19},{"team":"POR","power":36.4,"wins":37,"losses":40,"netRtg":-1.8,"rank":20},{"team":"CHI","power":28.7,"wins":32,"losses":44,"netRtg":-3.9,"rank":21},{"team":"NOP","power":26.0,"wins":25,"losses":49,"netRtg":-3.7,"rank":22},{"team":"MIL","power":25.5,"wins":32,"losses":43,"netRtg":-5.1,"rank":23},{"team":"DAL","power":24.4,"wins":26,"losses":50,"netRtg":-4.3,"rank":24},{"team":"MEM","power":24.3,"wins":25,"losses":51,"netRtg":-4.2,"rank":25},{"team":"UTA","power":14.6,"wins":22,"losses":54,"netRtg":-7.6,"rank":26},{"team":"IND","power":9.1,"wins":18,"losses":58,"netRtg":-8.8,"rank":27},{"team":"BKN","power":7.7,"wins":18,"losses":57,"netRtg":-9.2,"rank":28},{"team":"SAC","power":7.5,"wins":20,"losses":56,"netRtg":-9.8,"rank":29},{"team":"WAS","power":5.8,"wins":17,"losses":57,"netRtg":-11.2,"rank":30}]},{"date":"2026-03-27","label":"Mar 27","rankings":[{"team":"OKC","power":77.4,"wins":61,"losses":18,"netRtg":10.2,"rank":1},{"team":"SAS","power":71.6,"wins":59,"losses":19,"netRtg":7.9,"rank":2},{"team":"DET","power":68.8,"wins":55,"losses":22,"netRtg":7.6,"rank":3},{"team":"BOS","power":66.8,"wins":51,"losses":25,"netRtg":7.5,"rank":4},{"team":"NYK","power":63.6,"wins":52,"losses":27,"netRtg":6.4,"rank":5},{"team":"DEN","power":58.0,"wins":49,"losses":29,"netRtg":4.4,"rank":6},{"team":"HOU","power":56.5,"wins":47,"losses":29,"netRtg":4.2,"rank":7},{"team":"CLE","power":54.6,"wins":46,"losses":31,"netRtg":3.5,"rank":8},{"team":"CHA","power":53.6,"wins":41,"losses":37,"netRtg":4.4,"rank":9},{"team":"MIN","power":53.1,"wins":45,"losses":32,"netRtg":3.3,"rank":10},{"team":"ATL","power":47.8,"wins":43,"losses":34,"netRtg":1.5,"rank":11},{"team":"TOR","power":47.7,"wins":44,"losses":34,"netRtg":1.5,"rank":12},{"team":"ORL","power":47.6,"wins":42,"losses":34,"netRtg":1.6,"rank":13},{"team":"PHX","power":47.6,"wins":43,"losses":34,"netRtg":1.6,"rank":14},{"team":"LAL","power":47.4,"wins":48,"losses":31,"netRtg":0.7,"rank":15},{"team":"MIA","power":47.4,"wins":39,"losses":39,"netRtg":2.1,"rank":16},{"team":"LAC","power":45.4,"wins":39,"losses":37,"netRtg":1.4,"rank":17},{"team":"GSW","power":41.9,"wins":38,"losses":40,"netRtg":0.3,"rank":18},{"team":"PHI","power":41.3,"wins":41,"losses":35,"netRtg":-0.7,"rank":19},{"team":"POR","power":37.7,"wins":38,"losses":40,"netRtg":-1.3,"rank":20},{"team":"CHI","power":28.0,"wins":32,"losses":45,"netRtg":-4.2,"rank":21},{"team":"NOP","power":25.1,"wins":25,"losses":51,"netRtg":-3.9,"rank":22},{"team":"MIL","power":24.5,"wins":32,"losses":44,"netRtg":-5.4,"rank":23},{"team":"DAL","power":24.2,"wins":26,"losses":51,"netRtg":-4.3,"rank":24},{"team":"MEM","power":23.5,"wins":25,"losses":52,"netRtg":-4.4,"rank":25},{"team":"UTA","power":13.8,"wins":22,"losses":55,"netRtg":-7.8,"rank":26},{"team":"IND","power":9.1,"wins":18,"losses":59,"netRtg":-8.8,"rank":27},{"team":"BKN","power":7.8,"wins":18,"losses":58,"netRtg":-9.1,"rank":28},{"team":"SAC","power":6.7,"wins":20,"losses":58,"netRtg":-10.1,"rank":29},{"team":"WAS","power":6.2,"wins":18,"losses":57,"netRtg":-10.7,"rank":30}]}];


const GRAPH_TEAM_LINE_COLORS = {
  ATL:'#E03A3E', BKN:'#777777', BOS:'#007A33', CHA:'#00788C', CHI:'#CE1141',
  CLE:'#860038', DAL:'#00538C', DEN:'#FEC524', DET:'#C8102E', GSW:'#1D428A',
  HOU:'#CE1141', IND:'#002D62', LAC:'#C8102E', LAL:'#552583', MEM:'#5D76A9',
  MIA:'#F9A01B', MIL:'#00471B', MIN:'#78BE20', NOP:'#B4975A', NYK:'#F58426',
  OKC:'#007AC1', ORL:'#0077C0', PHI:'#006BB6', PHX:'#E56020', POR:'#E03A3E',
  SAC:'#5A2D81', SAS:'#C4CED4', TOR:'#CE1141', UTA:'#F9A01B', WAS:'#E31837',
};

const EAST_TEAMS = ['ATL','BKN','BOS','CHA','CHI','CLE','DET','IND','MIA','MIL','NYK','ORL','PHI','TOR','WAS'];
const WEST_TEAMS = ['DAL','DEN','GSW','HOU','LAC','LAL','MEM','MIN','NOP','OKC','PHX','POR','SAC','SAS','UTA'];
const ALL_GRAPH_TEAMS = [...EAST_TEAMS, ...WEST_TEAMS].sort();

let graphChart = null;
let graphYAxis = 'rank';
let graphActiveTeams = new Set();
let graphCurrentPreset = 'top10';

function getTopNTeams(n) {
  if (!WEEKLY_RANKINGS.length) return [];
  // Use the computed snapshot ranks (same source as what is plotted on the graph)
  // so Top 10 / Top 5 filters show exactly the teams at the rightmost graph point.
  const snapshots = getWeeklySnapshots();
  const lastSnapshot = snapshots[snapshots.length - 1];
  if (!lastSnapshot) return [];
  return Object.entries(lastSnapshot)
    .filter(function([, v]) { return v.rank <= n; })
    .sort(function([, a], [, b]) { return a.rank - b.rank; })
    .map(function([abbr]) { return abbr; });
}

function graphFilterPreset(preset, btn) {
  graphCurrentPreset = preset;
  document.querySelectorAll('.graph-filter-group .graph-preset-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const picker = document.getElementById('graph-team-picker');

  if (preset === 'top10') { graphActiveTeams = new Set(getTopNTeams(10)); picker.style.display = 'none'; }
  else if (preset === 'top5') { graphActiveTeams = new Set(getTopNTeams(5)); picker.style.display = 'none'; }
  else if (preset === 'all') { graphActiveTeams = new Set(ALL_GRAPH_TEAMS); picker.style.display = 'none'; }
  else if (preset === 'east') { graphActiveTeams = new Set(EAST_TEAMS); picker.style.display = 'none'; }
  else if (preset === 'west') { graphActiveTeams = new Set(WEST_TEAMS); picker.style.display = 'none'; }
  else if (preset === 'custom') { picker.style.display = 'block'; renderTeamChips(); }
  updateGraph();
}

function setGraphYAxis(axis, btn) {
  graphYAxis = axis;
  document.querySelectorAll('.graph-toggle-group .graph-preset-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  updateGraph();
}

function renderTeamChips() {
  const container = document.getElementById('graph-team-chips');
  let html = '';
  ALL_GRAPH_TEAMS.forEach(function(team) {
    const isOn = graphActiveTeams.has(team);
    const color = GRAPH_TEAM_LINE_COLORS[team] || '#888';
    const cls = isOn ? 'on' : 'off';
    const bgStyle = isOn ? 'background:' + color + ';border-color:' + color : '';
    html += '<div class="graph-chip ' + cls + '" style="' + bgStyle + '" onclick="toggleGraphTeam(\'' + team + '\')">' + team + '</div>';
  });
  container.innerHTML = html;
}

function toggleGraphTeam(team) {
  if (graphActiveTeams.has(team)) graphActiveTeams.delete(team);
  else graphActiveTeams.add(team);
  if (graphCurrentPreset === 'custom') renderTeamChips();
  updateGraph();
}

// Recompute power score for historical weekly snapshots.
// Uses the same formula but estimates net rating from win% with a calibrated
// linear mapping clamped to ±15, since we don't have historical rating data.
// For the most recent week, computePowerScore() is called directly instead.
function computeHistoricalPowerScore(abbr, wins, losses, recentW, recentL) {
  const gp = wins + losses;
  if (gp === 0) return 0;
  const winPct = wins / gp;
  const recentGP = recentW + recentL;
  const l20WinPct = recentGP > 0 ? recentW / recentGP : winPct;
  // Opponent quality proxy: league-average for historical snapshots
  const oppL20WinPct = 0.500;
  // Calibrated net rating estimate: (winPct - 0.5) × 42 → ±21 range, then clamp to ±15.
  // This maps .800 → +12.6, .500 → 0, .200 → -12.6 · realistic NBA range.
  const estNetRtg = Math.max(-15, Math.min(15, (winPct - 0.5) * 42));
  const normalizedNRTG = Math.max(0, Math.min(1, (estNetRtg + 15) / 30));
  const power = (
    (winPct          * 0.25) +
    (l20WinPct       * 0.20) +
    (oppL20WinPct    * 0.15) +
    (normalizedNRTG  * 0.40)
  ) * 100;
  return Math.round(power * 10) / 10;
}

// Build a division lookup map from STANDINGS_DATA (division doesn't change mid-season)
const _DIV_MAP = {};
STANDINGS_DATA.forEach(function(t) { _DIV_MAP[t.abbr] = t.div; });

// Pre-compute per-team per-week derived data from WEEKLY_RANKINGS diffs.
// The most recent week calls computePowerScore() directly so the graph tail
// always matches the rankings table exactly (same live ratings, same formula).
function buildWeeklySnapshots() {
  return WEEKLY_RANKINGS.map(function(week, wi) {
    const isLast = wi === WEEKLY_RANKINGS.length - 1;
    const prev = wi > 0 ? WEEKLY_RANKINGS[wi - 1] : null;

    const snapshot = {};
    week.rankings.forEach(function(entry) {
      const abbr = entry.team;

      if (isLast) {
        // Last week: use computePowerScore() directly · uses live _NET_RATINGS
        // so the graph tail always matches the rankings table.
        const standing = STANDINGS_DATA.find(function(t) { return t.abbr === abbr; });
        if (!standing) return;
        const ps = computePowerScore(standing);
        snapshot[abbr] = { power: ps.power, wins: standing.wins, losses: standing.losses };
      } else {
        // Historical week: derive recent results from weekly W-L diffs
        var recentW = 0, recentL = 0;
        if (prev) {
          const prevEntry = prev.rankings.find(function(r) { return r.team === abbr; });
          if (prevEntry) {
            recentW = Math.max(0, entry.wins - prevEntry.wins);
            recentL = Math.max(0, entry.losses - prevEntry.losses);
          } else {
            recentW = entry.wins;
            recentL = entry.losses;
          }
        } else {
          recentW = entry.wins;
          recentL = entry.losses;
        }

        const power = computeHistoricalPowerScore(abbr, entry.wins, entry.losses, recentW, recentL);
        snapshot[abbr] = { power: power, wins: entry.wins, losses: entry.losses };
      }
    });

    // Derive ranks within this snapshot
    const sorted = Object.keys(snapshot).sort(function(a, b) {
      return snapshot[b].power - snapshot[a].power;
    });
    sorted.forEach(function(abbr, i) { snapshot[abbr].rank = i + 1; });

    return snapshot;
  });
}

// Cache the snapshots so they're only computed once
// Lazily-built, cache-invalidated by applyLiveGameData
function getWeeklySnapshots() {
  if (!_weeklySnapshotsCache) _weeklySnapshotsCache = buildWeeklySnapshots();
  return _weeklySnapshotsCache;
}

function buildGraphDatasets() {
  const labels = WEEKLY_RANKINGS.map(function(w) {
    return w.label === 'Mar 27' ? 'Mar 27*' : w.label;
  });

  const datasets = [];
  ALL_GRAPH_TEAMS.forEach(function(team) {
    if (!graphActiveTeams.has(team)) return;
    const data = getWeeklySnapshots().map(function(snapshot) {
      const entry = snapshot[team];
      if (!entry) return null;
      return graphYAxis === 'rank' ? entry.rank : entry.power;
    });
    datasets.push({
      label: team,
      data: data,
      borderColor: GRAPH_TEAM_LINE_COLORS[team] || '#888',
      backgroundColor: (GRAPH_TEAM_LINE_COLORS[team] || '#888') + '33',
      borderWidth: 2.5,
      pointRadius: 3,
      pointHoverRadius: 7,
      pointBackgroundColor: GRAPH_TEAM_LINE_COLORS[team] || '#888',
      tension: 0.3,
      spanGaps: true,
    });
  });
  return { labels: labels, datasets: datasets };
}

function updateGraph() {
  const gd = buildGraphDatasets();
  if (graphChart) {
    graphChart.data.labels = gd.labels;
    graphChart.data.datasets = gd.datasets;
    graphChart.options.scales.y.reverse = graphYAxis === 'rank';
    graphChart.options.scales.y.title.text = graphYAxis === 'rank' ? 'Ranking (1 = Best)' : 'Power Score';
    graphChart.options.scales.y.min = graphYAxis === 'rank' ? 1 : undefined;
    graphChart.options.scales.y.max = graphYAxis === 'rank' ? 30 : undefined;
    // Hide custom tooltip when data changes
    var tip = document.getElementById('graph-custom-tooltip');
    if (tip) tip.style.display = 'none';
    graphChart.update();
  }
  renderGraphLegend();
}

function renderGraphLegend() {
  const container = document.getElementById('graph-legend');
  let html = '';
  // Use ENRICHED_DATA (current live rankings) for legend rank/record display
  const liveRankMap = {};
  const liveSorted = [...ENRICHED_DATA].sort(function(a, b) { return b.power - a.power; });
  liveSorted.forEach(function(t, i) { liveRankMap[t.abbr] = { rank: i + 1, wins: t.wins, losses: t.losses }; });

  const sortedTeams = Array.from(graphActiveTeams).sort(function(a, b) {
    const ra = liveRankMap[a] ? liveRankMap[a].rank : 30;
    const rb = liveRankMap[b] ? liveRankMap[b].rank : 30;
    return ra - rb;
  });
  sortedTeams.forEach(function(team) {
    const color = GRAPH_TEAM_LINE_COLORS[team] || '#888';
    const info = liveRankMap[team];
    const rankStr = info ? '#' + info.rank : '';
    const recStr = info ? ' (' + info.wins + '-' + info.losses + ')' : '';
    html += '<div class="graph-legend-item active" onclick="toggleGraphTeam(\'' + team + '\')" title="' + team + '">' +
      '<div class="graph-legend-swatch" style="background:' + color + '"></div>' +
      rankStr + ' ' + team + recStr +
    '</div>';
  });
  container.innerHTML = html;
}

function renderGraph() {
  graphActiveTeams = new Set(getTopNTeams(10));
  const ctx = document.getElementById('power-chart');
  if (!ctx) return;
  const gd = buildGraphDatasets();

  graphChart = new Chart(ctx, {
    type: 'line',
    data: { labels: gd.labels, datasets: gd.datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', intersect: true },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      scales: {
        x: {
          grid: { color: '#ffffff08' },
          ticks: { font: { family: "'Barlow Condensed', sans-serif", size: 11 }, color: '#666' }
        },
        y: {
          reverse: true,
          min: 1,
          max: 30,
          title: {
            display: true,
            text: 'Ranking (1 = Best)',
            font: { family: "'Barlow Condensed', sans-serif", size: 13, weight: '600' },
            color: '#888',
          },
          grid: { color: '#ffffff08' },
          ticks: {
            font: { family: "'Barlow Condensed', sans-serif", size: 11 },
            color: '#666',
            stepSize: 1,
          }
        }
      }
    }
  });
  renderGraphLegend();

  // Custom tooltip element
  var customTip = document.getElementById('graph-custom-tooltip');
  if (!customTip) {
    customTip = document.createElement('div');
    customTip.id = 'graph-custom-tooltip';
    customTip.style.cssText = [
      'position:absolute',
      'pointer-events:none',
      'background:#111118ee',
      'border:1px solid #333',
      'border-radius:6px',
      'padding:8px 14px',
      'font-family:"Barlow Condensed",sans-serif',
      'font-size:13px',
      'color:#fff',
      'letter-spacing:1px',
      'white-space:nowrap',
      'display:none',
      'z-index:999',
    ].join(';');
    ctx.parentElement.style.position = 'relative';
    ctx.parentElement.appendChild(customTip);
  }

  var lastHoveredIdx = null;

  function resetLines() {
    graphChart.data.datasets.forEach(function(ds) {
      var baseColor = GRAPH_TEAM_LINE_COLORS[ds.label] || '#888';
      ds.borderColor = baseColor;
      ds.borderWidth = 2.5;
      ds.pointRadius = 3;
    });
    graphChart.update('none');
  }

  ctx.addEventListener('mousemove', function(e) {
    var points = graphChart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
    if (!points.length) {
      // Not hovering over any line · reset everything
      if (lastHoveredIdx !== null) {
        lastHoveredIdx = null;
        resetLines();
      }
      customTip.style.display = 'none';
      return;
    }

    var hoveredIdx = points[0].datasetIndex;
    var hoveredDs = graphChart.data.datasets[hoveredIdx];
    var pointIdx = points[0].index;
    var val = hoveredDs.data[pointIdx];
    var team = hoveredDs.label;
    var baseColor = GRAPH_TEAM_LINE_COLORS[team] || '#888';

    // Only re-render if the hovered dataset changed
    if (hoveredIdx !== lastHoveredIdx) {
      lastHoveredIdx = hoveredIdx;
      graphChart.data.datasets.forEach(function(ds, i) {
        var c = GRAPH_TEAM_LINE_COLORS[ds.label] || '#888';
        if (i === hoveredIdx) {
          ds.borderColor = c;
          ds.borderWidth = 4;
          ds.pointRadius = 4;
        } else {
          ds.borderColor = c + '25';
          ds.borderWidth = 1.5;
          ds.pointRadius = 1;
        }
      });
      graphChart.update('none');
    }

    // Position and fill custom tooltip
    var rect = ctx.getBoundingClientRect();
    var parentRect = ctx.parentElement.getBoundingClientRect();
    var tipX = e.clientX - parentRect.left + 14;
    var tipY = e.clientY - parentRect.top - 16;
    var valStr = graphYAxis === 'rank' ? '#' + val : (val !== null ? val.toFixed(1) : '');
    customTip.style.borderColor = baseColor;
    customTip.innerHTML = '<span style="color:' + baseColor + ';font-weight:700;">' + team + '</span> &nbsp;' + valStr;
    customTip.style.left = tipX + 'px';
    customTip.style.top = tipY + 'px';
    customTip.style.display = 'block';
  });

  ctx.addEventListener('mouseleave', function() {
    lastHoveredIdx = null;
    customTip.style.display = 'none';
    resetLines();
  });
}


// ============================================================

// ============================================================
// BETTING LEDGER — $10/game on Clanker's pick, American odds
// ============================================================

