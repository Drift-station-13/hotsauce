var rsc_index;

function set_index(i) {
	rsc_index = i;
}

var global_lock;

function set_global_lock(l) {
	global_lock = l;
}

function compute_types(list) {
	if (list==null) {
		console.log("compute_types issue!");
		return;
	}

	list.forEach(function(n) {
		get_type(n);
	});
}

function get_type(v) {
	var t = null;
	if (v!=null) {
		if (typeof(v)=="boolean" || v===0 || v===1)
			t = "bool";
		else if (typeof(v)=="number") {
			if (v%1 === 0 && v !== 9.999999848243207e+30 && v !== -9.999999848243207e+30) {
				t = "int";
			} else {
				t = "double";
			}
		} else if (typeof(v)=="string") {
			t = "string";
		} else if (v.type) {
			if (typeof(v.type)=="function")
				t = v.type();
			else
				t = v.type;
		} else if (v instanceof Array) {
			if (v[0]=="class")
				t = "Type";
			else if (v[0]=="rsc") {
				var rsc_path = rsc_index[v[1]];
				var rsc_ext = rsc_path.split(".").pop();
				/*if (rsc_ext=="dmi") {
					t = "Icon";
				} else if (rsc_ext=="ogg") {
					t = "Sound";
				} else {
					t = "string"
				}*/
				t = "string";
			}
			else if (v[0]=="list_ctor")
				t= "ByTable";
			else if (v[0]=="client")
				t= "Client";
			else if (v[0]=="raw_type")
				t= v[1];
			else if (v[0]=="proc") {
				//console.log("p type",v[1]);
				t= "System.Reflection.MethodInfo";
			}
			else {
				//console.log("type? A ",v[0]);
				t = "dynamic";
			}
		} else {
			//console.log("type?",v.constructor.name);
			t = "dynamic";
		}
	}
	return t;
}

function NodeVar(n,v,s,l,a) {
	this.name = n;
	this.type = null;
	this._static = s;
	this._const = s;
	this.local = l;
	this.is_arg = a;

	//this.suggest_was_soft = true;

	this.setInitial(v);
}

NodeVar.prototype.clone = function() {
	var v = new NodeVar();
	v.name = this.name;
	v.type = this.type;
	v._static = this._static;
	v._const = this._const;
	v.local = this.local;
	v.locked = this.locked;
	v.value = this.value;
	v.master = this.master;
	v.is_arg = this.is_arg;

	v.suggest_was_soft = this.suggest_was_soft;
	
	return v;
}

NodeVar.prototype.is_const_type = function() {
	return this.type=="int" || this.type=="double" || this.type=="bool" || this.type=="string" || this.type=="int?" || this.type=="bool?" || this.type=="double?";
}

NodeVar.prototype.def = function(expand_f,tabs,as_defret,etc,is_arg) {
	var pre = "";

	if (this.dbg!=null)
		pre+="["+this.dbg+"]";

	if (!as_defret) {
		if (!this.local)
			pre += "public ";

		//if (this._const) {
		//	pre += "const ";
		//}
		if (this._static) {
			if (this._const) {
				if (this.is_const_type() && (typeof(this.value) == "number" || typeof(this.value) == "boolean" || typeof(this.value) == "string"))  
					pre += "const ";
				else
					pre += "static readonly ";
			} else {
				pre += "static ";
			}
		}

		if (etc != null)
			pre += etc;
	}

	var def_type = this.type||"dynamic";

	if (this._const) {
		if (def_type=="bool?") {
			def_type="bool";
		}
		else if (def_type=="int?") {
			def_type="int";
		}
		else if (def_type=="double?") {
			def_type="double";
		}
		this.type = def_type;
	}

	/*if (def_type=="int" || def_type=="double" || def_type=="bool")
		def_type= def_type+"?";
*/
	//if (!is_arg) {
		
		/*
		if ( (this.type=="int" || this.type=="double") && typeof(this.value)!="number" && expand_f != null)
			expand_f = function() {return 0}
		else if (this.type=="bool" && typeof(this.value)!="boolean" && expand_f != null)
			expand_f = function() {return false}
		*/

		//else if (this.type=="string" && typeof(this.value)!="string" && expand_f != null)
		//	expand_f = function() {return '""'}
	/*} else {
		if (def_type=="int" || def_type == "double" || def_type=="bool") {
			def_type= def_type+"?";
		}
	}*/

	var name = "";
	if (as_defret)
		name = "_default";
	else if (this.name != null) {
		name = this.name;
	}

	return pre + def_type + " " + name + (expand_f ? " = " + expand_f(this.value,tabs,null,def_type) : "");
}
/*
function type_check(t,a) {
	a.forEach(function(tt) {
		if (t == tt)
			return true;
	});
	return false;
}
*/
function type_microcode(t) {
	switch (t) {
		case "bool":    return 1;
		case "int":     return 2;
		case "double":  return 3;
		case "bool?":   return 5;
		case "int?":    return 6;
		case "double?": return 7;
	}
}

NodeVar.prototype.suggest = function(v,raw,softmode) {
	//if (global_lock)
	//	console.log("NOPE");

	if (this.locked || (global_lock && !this.freebird ) )
		return;

	if (this.type!="dynamic") {
		var suggested;
		var suggested_null = false;

		if (raw)
			suggested = v;
		else {
			suggested = get_type(v);
			if (v==null)
				suggested_null = true;
		}

		if (suggested=="Base_Static")
			suggested = "Ent_Static";

		if (softmode && suggested == "dynamic") // softmode shouldn't carry over hard dynamics!
			return;

		/*if (this.name=="source") {
			if (this.dbg==null)
				this.dbg = "";

			this.dbg+=this.type+" ";
		}*/

		var code_current = type_microcode(this.type);
		var code_suggest = type_microcode(suggested);

		if (suggested_null && code_current && code_current<4) { // HANDLE NULLIFICATION.
			this.type = this.type+"?";
			this.suggest_was_soft = false;
		}
		else if (suggested == "void" || this.type == suggested) // NO.
			return;
		else if (this.type == null || this.type == "void") { // YES. (WE HAVE NOTHING TO WORK WITH ATM.)
			this.type = suggested;
			this.suggest_was_soft = true;
		}
		else if (suggested==null) // WORTHLESS AT THIS POINT (WE ALREADY UNSET VOID IF WE NEEDED)
			return;
		else if ( code_current || code_suggest ) {
			if ( code_current && code_suggest ) { // both are prims, find the common type.

				var result_is_nullable = false;
				if (code_current>4) {
					code_current-=4;
					result_is_nullable = true;
				}
				if (code_suggest>4) {
					code_suggest-=4;
					result_is_nullable = true;
				}

				var code_c = Math.max(code_current,code_suggest);
				if (result_is_nullable) code_c+=4;
				
				switch (code_c) {
					case 1: this.type = "bool";    break;
					case 2: this.type = "int";     break;
					case 3: this.type = "double";  break;
					case 5: this.type = "bool?";   break;
					case 6: this.type = "int?";    break;
					case 7: this.type = "double?"; break;
				}
			} else {
				this.type = "dynamic"; //only one is a prim, not much we can do.
			}
			this.suggest_was_soft = false;
		}
		else { // find common type between two fuckboys.
			var c_current = map_classes[this.type];
			var c_suggest = map_classes[suggested];

			var collision_map = {};

			if (c_current != null && c_suggest !=null) {
				
				if (this.suggest_was_soft) { // overwrite previous soft suggest, if necessary!

					var i_class = c_suggest;

					while (i_class != null) {
						if (i_class == c_current) {
							//console.log("soft "+c_current.name+" -> "+suggested);
							this.type = suggested;
							this.suggest_was_soft = false//softmode;
							return;
						}
						i_class = i_class.parent;
					}
				}



				var i_current = c_current;
				var i_suggest = c_suggest;

				var winner;
				for (;;) {
					if (i_current!=null) {
						if (softmode && i_current.name == c_suggest.name) {
							return;
						}
						if (collision_map[i_current.name]) {
							winner = i_current.name;
							break;
						}
						collision_map[i_current.name] = true;
						i_current = i_current.parent;
					}

					if (i_suggest!=null) {
						if (collision_map[i_suggest.name]) {
							winner = i_suggest.name;
							break;
						}
						collision_map[i_suggest.name] = true;
						i_suggest = i_suggest.parent;
					}

					if (i_current==null && i_suggest==null) {
						winner = "dynamic";
						break;
					}
				}

				//console.log("SUGGEST/SUCCESS",this.type,suggested,winner);
				this.type = winner;
				this.suggest_was_soft = false; // the madness stops here!
			} else {
				//console.log("SUGGEST/FAIL",this.type,suggested);
				this.suggest_was_soft = false;
				this.type = "dynamic";
			}
		}
	}

	/*if (this.dbg==null)
		this.dbg = "";

	this.dbg+=this.type+" ";*/

	//if (this.name=="active_ais")
	//	console.log("================================>",v,v.constructor.name,this.type,"-",suggested);
}

NodeVar.prototype.setInitial = function(v) {
	this.value = v;
	this.suggest(v);
}










var reserved_keywords = [
	"abstract","as","base","bool",
	"break","byte","case","catch",
	"char","checked","class","const",
	"continue","decimal","default","delegate",
	"do","double","else","enum",
	"event","explicit","extern","false",
	"finally","fixed","float","for",
	"foreach","goto","if","implicit",
	"in","int","interface",
	"internal","is","lock","long",
	"namespace","new","null","object",
	"operator","out","override",
	"params","private","protected","public",
	"readonly","ref","return","sbyte",
	"sealed","short","sizeof","stackalloc",
	"static","string","struct","switch",
	"this","throw","true","try",
	"typeof","uint","ulong","unchecked",
	"unsafe","ushort","using","virtual",
	"void","volatile","while"

	// todo contextual keywords


];

var map_keywords = {};
reserved_keywords.forEach(function(n) {map_keywords[n]=true;});

function ffunc(n,t,a,va) {
	var f = {args:[],vars:[],dc:[]};
	
	f.varData = fvar(n,t);
	f.locals_named = true;
	f.fake = true;

	if (va!=null)
		f.uses_arglist = true;

	for (var i=0;i<a.length;i++) {
		if (a[i] instanceof Array)
			var new_var = new fvar(a[i][1],a[i][0])
		else
			var new_var = new fvar(null,a[i])
		new_var.local = true;
		new_var.is_arg = true;
		//new_var.locked = true;
		f.args.push(new_var);
	}
	
	return f;
}

function fvar(n,t) {
	var v = new NodeVar(n);
	v.type = t;
	v.fake = true;
	v.var_hint = true;
	v.locked = true;
	return v;
}

var g_v_name_map = {};

function submit_v_name(vn,c) {
	if (g_v_name_map[vn] == null) {
		g_v_name_map[vn] = c;
	} else {
		g_v_name_map[vn] = false;
	}
}

var g_var_name_map = {};

function submit_var_name(vn,c) {
	if (vn == "dna_block") console.log("HERE B0SS!");
	if (g_var_name_map[vn] == null) {
		g_var_name_map[vn] = c;
	} else {
		g_var_name_map[vn] = false;
	}
}



var map_classes = {}; // Todo ADD RESERVED

map_classes["ByTable"] = {
	name: "ByTable",
	vars: {
		len: fvar("len","int")
	},
	v_names: {
		"$Add": ffunc("Add","void",[],"dynamic"),
		"$Copy": ffunc("Copy","ByTable",["int?","int"]),
		"$Cut": ffunc("Cut","void",["int?","int"]),
		"$Find": ffunc("Find","int",["dynamic","int?","int"]),
		"$Insert": ffunc("Insert","void",["int"],"dynamic"),
		"$Remove": ffunc("Remove","bool",[],"dynamic"),
		"$Swap": ffunc("Swap","void",["int","int"]),
		"$Contains": ffunc("Contains","bool",["dynamic"]),
		"$WriteMsg": ffunc("WriteMsg","void",["dynamic"])
	}
}

map_classes["File"] = {
	name: "File",
	func_ctor: ffunc(null,null,["string"]),
	vars: {},
	v_names: {
		"$WriteMsg": ffunc("WriteMsg","void",["dynamic"])
	}
}

map_classes["Txt"] = {
	name: "Txt",
	func_ctor: ffunc(null,null,["string"]),
	vars: {},
	v_names: {
		"$item": ffunc("item","Txt",["dynamic"]),
		"$st_nd_rd": ffunc("st_nd_rd","Txt",["dynamic"]),
		"$a": ffunc("a","Txt",["dynamic"]),
		"$A": ffunc("A","Txt",["dynamic"]),
		"$the": ffunc("the","Txt",["dynamic"]),
		"$The": ffunc("The","Txt",["dynamic"]),

		"$he_she_it_they": ffunc("he_she_it_they","Txt",[]),
		"$He_She_It_They": ffunc("He_She_It_They","Txt",[]),
		"$his_her_its_their": ffunc("his_her_its_their","Txt",[]),
		"$His_Her_Its_Their": ffunc("His_Her_Its_Their","Txt",[]),
		"$his_hers_its_theirs": ffunc("his_hers_its_theirs","Txt",[]),
		"$His_Hers_Its_Theirs": ffunc("His_Hers_Its_Theirs","Txt",[]),
		"$him_her_it_them": ffunc("him_her_it_them","Txt",[]),
		"$himself_herself_itself_themself": ffunc("himself_herself_itself_themself","Txt",[]),
		
		"$no_newline": ffunc("no_newline","Txt",[]),
		"$s": ffunc("s","Txt",[]),
		"$proper": ffunc("proper","Txt",[]),
		"$improper": ffunc("improper","Txt",[]),

		"$red": ffunc("red","Txt",[]),
		"$green": ffunc("green","Txt",[]),
		"$blue": ffunc("blue","Txt",[]),
		"$black": ffunc("black","Txt",[]),

		"$Ref": ffunc("Ref","Txt",["dynamic"]),
		"$icon": ffunc("icon","Txt",["dynamic"]),
		"$roman": ffunc("roman","Txt",["int"]),
		"$Roman": ffunc("Roman","Txt",["int"]),
		
		"$str": ffunc("str","Txt",["string"]),
		"$ToString": ffunc("ToString","string",[])
	}
}

map_classes["SaveFile"] = {
	name: "SaveFile",
	func_ctor: ffunc(null,null,["string"]),
	vars: {
		cd: fvar("cd","string"),
		dir: fvar("dir","ByTable"),
	},
	v_names: {
		"$ExportText": ffunc("ExportText","string",["string","string"])
	}
}


// These are never processed by member naming so we have to register v names (and vars if we end up covering them too!)
for (var k in map_classes) {
	var c = map_classes[k];

	for (var kk in c.vars) {
		submit_var_name(kk,c);
	}

	for (var kk in c.v_names) {
		submit_v_name(kk,c);
	}
}


/*
map_classes["string"] = {
	name: "string",
	vars: {
		Length: fvar("Length","int")
	},
	v_names: {}
}*/
/*
map_classes["Base_Data"] = {
	vars: {},
	v_names: {
		//"$Del": ffunc("Del","void",0)
	}
}
*/
/*
map_classes["Data"] = {
	vars: {
		vars: fvar("vars","ByTable")
	},
	v_names: {}
}

map_classes["Ent_Static"] = {
	vars: {
		dir: fvar("dir","int"),
		icon: fvar("icon","Icon"),
		icon_state: fvar("icon_state","string"),
		layer: fvar("layer","int")
	},
	v_names: {}
}

map_classes["Ent_Dynamic"] = {
	vars: {},
	v_names: {}
}

map_classes["Mob"] = {
	vars: {
		ckey: fvar("ckey","string")
	},
	v_names: {}
}

map_classes["Image"] = {
	vars: {},
	v_names: {}
}
*/

/*
var partial_classes = {
	"/datum": "Data",
	"/atom": "Ent_Static",
	"/atom/movable": "Ent_Dynamic",
	"/mob": "Mob",
	"/image": "Image"
}
*/
var map_libs = {};

map_libs["Game13"] = {
	address: fvar("address","string"),
	area: fvar("default_zone","Type"),
	byond_version: fvar("byond_version","int"),
	cache_lifespan: fvar("cache_lifespan","int"),
	contents: fvar("contents","ByTable"),
	cpu: fvar("cpu","int"),
	executor: fvar("executor","string"),
	fps: fvar("fps","int"),
	game_state: fvar("game_state","bool"),
	host: fvar("host","string"),
	hub: fvar("hub","string"),
	hub_password: fvar("hub_password","string"),
	icon_size: fvar("icon_size","int"),
	internet_address: fvar("internet_address","string"),
	log: fvar("log","File"),
	loop_checks: fvar("loop_checks","bool"),
	map_format: fvar("map_format","int"),
	maxx: fvar("map_size_x","int"),
	maxy: fvar("map_size_y","int"),
	maxz: fvar("map_size_z","int"),
	mob: fvar("default_mob","Type"),
	name: fvar("name","string"),
	params: fvar("v_params","ByTable"),
	port: fvar("port","int"),
	realtime: fvar("realtime","double"),
	reachable: fvar("reachable","bool"),
	sleep_offline: fvar("sleep_offline","bool"),
	status: fvar("status","string"),
	system_type: fvar("system_type","string"),
	tick_lag: fvar("tick_lag","double"),
	time: fvar("time","int"),
	timeofday: fvar("timeofday","int"),
	turf: fvar("default_tile","Type"),
	url: fvar("url","string"),
	version: fvar("version","int"),
	view: fvar("view","dynamic"),
	visibility: fvar("visibility","bool")
}


map_libs["Lang13"] = {
	isNumber: ffunc("IsNumber","bool",["dynamic"]),
	isLocation: ffunc("IsLocation","bool",["dynamic"]),
	get_all_types: ffunc("get_all_types","ByTable",[],"dynamic"),
	hascall: ffunc("HasCall","bool",["dynamic","string"]),
	findClass: ffunc("FindClass","Type",["string"]),
	is_in_range: ffunc("IsInRange","bool",["double","double","double"]),
	length: ffunc("Length","int",["dynamic"])
}

map_libs["Icon13"] = {
	create: ffunc("create","Base_Icon",["dynamic","dynamic","int","int","bool"]),
	states: ffunc("States","ByTable",["dynamic","int"]),
	oper_getpixel: ffunc("oper_getpixel","string",["Base_Icon","int","int","string","int","int","bool"]),
	oper_dim: ffunc("oper_dim","int",["Base_Icon","bool"]),
	oper_set_intensity: ffunc("oper_set_intensity","void",["Base_Icon","int","int","int"]),
	oper_insert: ffunc("oper_insert","void",["Base_Icon","Icon","string","int","int","bool","dynamic"]),

	oper_draw_box: ffunc("oper_draw_box","void",["Base_Icon","string","int?","int?","int?","int?"]),
	oper_blend: ffunc("oper_blend", "void", ["Base_Icon","Icon","int?","int?","int?"])
}

map_libs["File13"] = {
	exists: ffunc("Exists","bool",["string"]),
	list: ffunc("List","ByTable",["string"]),
	read: ffunc("Read","string",["string"]),
	"delete": ffunc("Delete","bool",["string"])
}

map_libs["String13"] = {
	order: ffunc("GetOrder","int",[],"string"),
	Concat: ffunc("Concat","string",[],"string"),
	compare: ffunc("CompareIgnoreCase","bool",["string","string"]),
	find: ffunc("FindIgnoreCase","int",["string","string","int","int"]),
	find_exact_case: ffunc("Find","int",["string","string","int","int"]),
	substr: ffunc("SubStr","string",["string","int","int"]),
	toUpper: ffunc("ToUpper","string",["string"]),
	toLower: ffunc("ToLower","string",["string"]),
	numberToString: ffunc("NumberToString","string",["double","int"]),
	getCharCode: ffunc("GetCharCode","int",["string","int?"]),
	codeToChar: ffunc("GetCharFromCode","string",["int"]),
	color_code: ffunc("ColorCode","string",["int","int","int","int"]),
	formatTime: ffunc("FormatTime","string",["double","string"]),
	parseNumber: ffunc("ParseNumber","double?",["string"]),
	conv_list2urlParams: ffunc("MakeUrlParams","string",["ByTable"]),
	conv_urlParams2list: ffunc("ParseUrlParams","ByTable",["string"]),
	html_encode: ffunc("HtmlEncode","string",["string"]),
	html_decode: ffunc("HtmlDecode","string",["string"]),
	url_encode: ffunc("UrlEncode","string",["string","bool"]),
	url_decode: ffunc("UrlDecode","string",["string"]),
	ckey: ffunc("CKey","string",["string"]),
	ckey_preserve_case: ffunc("CKeyPreserveCase","string",["string"])
}

map_libs["Map13"] = {
	get_tile_at: ffunc("GetTile","Tile",["int","int","int"]),

	get_dist: ffunc("GetDistance","int",["dynamic","dynamic"]),

	step: ffunc("Step","void",["Ent_Dynamic","int"]),
	step_towards: ffunc("StepTowards","void",["Ent_Dynamic","Ent_Static","int"]),
	step_away: ffunc("StepAway","void",["Ent_Dynamic","Ent_Static","int?"]),
	step_towards_stupid: ffunc("StepTowardsSimple","void",["Ent_Dynamic","Ent_Static","int"]),
	step_rand: ffunc("StepRandom","void",["Ent_Dynamic"]),

	get_step: ffunc("GetStep","Tile",["Ent_Static","int"]),
	get_step_towards: ffunc("GetStepTowards","Tile",["Ent_Static","Ent_Static","int"]),
	get_step_away: ffunc("GetStepAway","Tile",["Ent_Static","Ent_Static","int?"]),
	get_step_towards_stupid: ffunc("GetStepTowardsSimple","Tile",["Ent_Static","Ent_Static"]),
	get_step_rand: ffunc("GetStepRandom","Tile",["Ent_Static"]),

	walk: ffunc("Walk","void",["Ent_Dynamic","int","int"]),
	walk_towards: ffunc("WalkTowards","void",["Ent_Dynamic","dynamic","int","int"]),
	walk_away: ffunc("WalkAway","void",["Ent_Dynamic","Ent_Static","int?","int"]),
	walk_towards_stupid: ffunc("WalkTowardsSimple","void",["Ent_Dynamic","Ent_Static","int","int"]),

	fetch_in_block: ffunc("FetchInBlock","ByTable",["Ent_Static","Ent_Static"]),

	fetch_in_range: ffunc("FetchInRange","ByTable",["dynamic","dynamic"]),
	fetch_in_range_nocenter: ffunc("FetchInRangeExcludeThis","ByTable",["dynamic","dynamic"]),

	fetch_in_view: ffunc("FetchInView","ByTable",["dynamic","dynamic"]),
	fetch_in_view_nocenter: ffunc("FetchInViewExcludeThis","ByTable",["dynamic","dynamic"]),

	fetch_viewers: ffunc("FetchViewers","ByTable",["dynamic","dynamic"]),
	fetch_viewers_nocenter: ffunc("FetchViewersExcludeThis","ByTable",["dynamic","dynamic"]),

	fetch_hearers: ffunc("FetchHearers","ByTable",["dynamic","dynamic"]),
	fetch_hearers_nocenter: ffunc("FetchHearersExcludeThis","ByTable",["dynamic","dynamic"])
}

map_libs["Num13"] = {
	round: ffunc("Round","double",["double","double"]),
	floor: ffunc("Floor","int",["double"]),
	//max: ffunc("max","double",VARDIC),
	//min: ffunc("min","double",VARDIC),
	rotate_dir: ffunc("Rotate","int",["dynamic","double"]),
	Md5: ffunc("Md5","string",["string"]),
	matrix: ffunc("Matrix","Matrix",[],"dynamic")
}

map_libs["Math"] = {
	Abs: ffunc("Abs","double",["double"]),
	Sin: ffunc("Sin","double",["double"]),
	Cos: ffunc("Cos","double",["double"]),
	Asin: ffunc("Asin","double",["double"]),
	Acos: ffunc("Acos","double",["double"]),
	Log: ffunc("Log","double",["double","double"]),
	Sqrt: ffunc("Sqrt","double",["double"]),
	Pow: ffunc("Pow","double",["double","double"])
}

map_libs["DB13"] = {
	new_con: ffunc("new_con","DB13_CONNECTION",[]),
	new_query: ffunc("new_query","DB13_QUERY",[]),
	connect: ffunc("connect","bool",["DB13_CONNECTION","string","string","string","dynamic","dynamic"]),
	execute: ffunc("execute","bool",["DB13_QUERY","string","DB13_CONNECTION","dynamic","dynamic"]),
	next_row: ffunc("next_row","bool",["DB13_QUERY","ByTable","ByTable"]),
	error_msg: ffunc("error_msg","string",["dynamic"]),
	close: ffunc("close","bool",["dynamic"]),
	is_connected: ffunc("is_connected","bool",["DB13_CONNECTION"]),
	rows_affected: ffunc("rows_affected","int",["DB13_QUERY"]),
	row_count: ffunc("row_count","int",["DB13_QUERY"]),
	quote: ffunc("quote","string",["DB13_CONNECTION","string"]),
	columns: ffunc("columns","ByTable",["DB13_QUERY","Type"])
}

map_libs["Rand13"] = {
	PercentChance: ffunc("PercentChance","bool",["int"]),
	Int: ffunc("Int","int",["int","int"]),
	Float: ffunc("Float","double",[])
}

map_libs["Sys13"] = {
	execute: ffunc("Execute","int?",["string"])
}

map_libs["Interface13"] = {
	is_stat_panel_active: ffunc("IsStatPanelActive","bool",["string"]),
	window_get: ffunc("WindowGet","string",["dynamic","string","string"]),
	window_exists: ffunc("WindowExists","bool",["dynamic","string"]),
	alert: ffunc("Alert","string",["dynamic","string","string","string","string","string"]),
	input: ffunc("Input","dynamic",["dynamic","dynamic","dynamic","dynamic","dynamic","dynamic"])
}

map_libs["Task13"] = {
	Sleep: ffunc("Sleep","void",["int"]),
	User: fvar("User","Mob")
}


function unkeyword(name) {
	if (map_keywords[name])
		name= "_"+name;
	return name;
}

function name_globals(data) {
	
	// Manual Renames!
	data.classes["/som13/client"] = {
		path: "/som13/client",
		name: "Base_Client",
		engine_side: true,
		vars: {
			address: ["raw_type","string"],
			authenticate: ["raw_type","bool"],
			byond_version: ["raw_type","int"],
			ckey: ["raw_type","string"],
			color: ["raw_type","dynamic"],
			command_text: ["raw_type","string"],
			computer_id: ["raw_type","string"],
			connection: ["raw_type","string"],
			control_freak: ["raw_type","int"],
			default_verb_category: ["raw_type","string"],
			dir: ["raw_type","int"],
			edge_limit: ["raw_type","string"],
			eye: ["raw_type","dynamic"],
			gender: ["raw_type","string"],
			images: ["raw_type","ByTable"],
			inactivity: ["raw_type","int"],
			key: ["raw_type","string"],
			lazy_eye: ["raw_type","int"],
			mob: ["raw_type","Mob"],
			mouse_pointer_icon: ["raw_type","dynamic"],
			perspective: ["raw_type","int"],
			pixel_x: ["raw_type","int"],
			pixel_y: ["raw_type","int"],
			pixel_z: ["raw_type","int"],
			pixel_step_size: ["raw_type","int"],
			preload_rsc: ["raw_type","dynamic"],
			screen: ["raw_type","ByTable"],
			script: ["raw_type","string"],
			show_map: ["raw_type","bool"],
			show_popup_menus: ["raw_type","bool"],
			show_verb_panel: ["raw_type","bool"],
			statobj: ["raw_type","Ent_Dynamic"],
			verbs: ["raw_type","ByTable"],
			view: ["raw_type","int"],
			virtual_eye: ["raw_type","Ent_Static"]
		},
		vars_inherited: {},
		methods: {
			"/som13/client/proc/Del": ffunc("Del","void",[]),
			"/som13/client/proc/Move": ffunc("Move","bool",[["dynamic","loc"],["int","dir"]]),
			"/som13/client/proc/Stat": ffunc("Stat","dynamic",[]),
			"/som13/client/proc/Topic": ffunc("Topic","void",[["string","href"],["ByTable","href_list"],["dynamic","hsrc"]]),
			"/som13/client/proc/Click": ffunc("Click","void",[["Ent_Static","_object"],["dynamic","location"],["string","control"],["string","_params"]]),
			"/som13/client/proc/WriteMsg": ffunc("WriteMsg","void",["dynamic"])
		},
		verbs: {}
	}

	//map_classes

	data.classes["/som13/datum"] = {
		path: "/som13/datum",
		name: "Base_Data",
		engine_side: true,
		vars: {
			type: ["raw_type","Type"],
			tag: ["raw_type","string"],
			vars: ["raw_type","ByTable"]
		},
		vars_inherited: {},
		methods: {
			"/som13/datum/proc/Del": ffunc("Del","void",[]),
			"/som13/datum/proc/Read": ffunc("Read","void",[["SaveFile","F"],["dynamic","__id"],["dynamic","locorner"]]),
			"/som13/datum/proc/Write": ffunc("Write","void",[["SaveFile","F"]]),
			"/som13/datum/proc/Topic": ffunc("Topic","dynamic",[["string","href"],["ByTable","href_list"],["dynamic","hsrc"]])
		},
		verbs: {}
	}

	data.classes["/som13/atom"] = {
		path: "/som13/atom",
		parent: "/datum",
		name: "Base_Static",
		engine_side: true,
		vars: {

			// All of these concern the appearance.
			appearance: ["raw_type","Appearance"],
			appearance_flags: ["raw_type","int"],
			alpha: ["raw_type","int"],
			blend_mode: ["raw_type",,"int"],
			color: ["raw_type","string"],
			desc: ["raw_type","string"],
			gender: ["raw_type","string"],
			icon: ["raw_type","string"],
			icon_state: ["raw_type","string"],
			invisibility: ["raw_type","int"],
			infra_luminosity: ["raw_type","double"],
			layer: ["raw_type","double"],
			luminosity: ["raw_type","double"],
			maptext: ["raw_type","string"],
			maptext_width: ["raw_type","int"],
			maptext_height: ["raw_type","int"],
			maptext_x: ["raw_type","int"],
			maptext_y: ["raw_type","int"],
			mouse_over_pointer: ["raw_type","dynamic"],
			mouse_drag_pointer: ["raw_type","dynamic"],
			mouse_drop_pointer: ["raw_type","dynamic"],
			mouse_drop_zone: ["raw_type","bool"],
			mouse_opacity: ["raw_type","int"],
			name: ["raw_type","string"],
			opacity: ["raw_type","bool"],
			overlays: ["raw_type","ByTable"],
			//override (images only)
			pixel_x: ["raw_type","int"],
			pixel_y: ["raw_type","int"],
			pixel_z: ["raw_type","int"],
			plane: ["raw_type","int"],
			suffix: ["raw_type","string"],
			text: ["raw_type","string"],
			transform: ["raw_type","Matrix"],
			underlays: ["raw_type","ByTable"],
			
			contents: ["raw_type","ByTable"],
			loc: ["raw_type","Ent_Static"],
			x: ["raw_type","int"],
			y: ["raw_type","int"],
			z: ["raw_type","int"],
			dir: ["raw_type","int"],

			density: ["raw_type","bool"],
			verbs: ["raw_type","ByTable"]
		},
		vars_inherited: {},
		methods: {
			"/som13/atom/proc/Click": ffunc("Click","bool",[["dynamic","loc"],["string","control"],["string","_params"]]),
			"/som13/atom/proc/DblClick": ffunc("DblClick","bool",[["dynamic","loc"],["string","control"],["string","_params"]]),

			"/som13/atom/proc/MouseDown": ffunc("MouseDown","bool",[["dynamic","loc"],["string","control"],["string","_params"]]),
			"/som13/atom/proc/MouseUp": ffunc("MouseUp","bool",[["dynamic","loc"],["string","control"],["string","_params"]]),

			"/som13/atom/proc/MouseEntered": ffunc("MouseEntered","bool",[["dynamic","loc"],["string","control"],["string","_params"]]),
			"/som13/atom/proc/MouseExited": ffunc("MouseExited","bool",[["dynamic","loc"],["string","control"],["string","_params"]]),
			"/som13/atom/proc/MouseMove": ffunc("MouseMove","bool",[["dynamic","loc"],["string","control"],["string","_params"]]),

			//"/som13/atom/proc/MouseDrag": ffunc("MouseDrag","bool",[["dynamic","loc"],["string","control"],["string","params"]]),
			//"/som13/atom/proc/MouseDrop": ffunc("MouseDrop","bool",[["dynamic","loc"],["string","control"],["string","params"]]),

			"/som13/atom/proc/Enter": ffunc("Enter","bool",[["Ent_Dynamic","O"],["Ent_Static","oldloc"]]),
			"/som13/atom/proc/Exit": ffunc("Exit","bool",[["Ent_Dynamic","O"],["Ent_Static","newloc"]]),

			"/som13/atom/proc/Entered": ffunc("Entered","void",[["Ent_Dynamic","Obj"],["Ent_Static","oldloc"]]),
			"/som13/atom/proc/Exited": ffunc("Exited","void",[["Ent_Dynamic","Obj"],["Ent_Static","newloc"]]),

			//"/som13/atom/proc/Move": ffunc("Move","bool",[["dynamic","loc"],["int","dir"]]),

			"/som13/atom/proc/Stat": ffunc("Stat","dynamic",[])
		},
		verbs: {},
		func_ctor: {
			args: ["loc"],
			vars: [],
			dc: []
		}
	}

	data.classes["/som13/atom/movable"] = {
		path: "/som13/atom/movable",
		parent: "/atom",
		name: "Base_Dynamic",
		engine_side: true,
		vars: {
			bound_x: ["raw_type","int"],
			bound_y: ["raw_type","int"],
			bound_width: ["raw_type","int"],
			bound_height: ["raw_type","int"],

			glide_size: ["raw_type","int"],
			screen_loc: ["raw_type","string"],

			step_size: ["raw_type","int"],

			step_x: ["raw_type","int"],
			step_y: ["raw_type","int"]
		},
		vars_inherited: {},
		//vars_system: {},
		methods: {
			"/som13/atom/movable/proc/Bump": ffunc("Bump","void",[["Ent_Static","Obstacle"],["dynamic","yes"]]),
			"/som13/atom/movable/proc/Cross": ffunc("Cross","bool",[["Ent_Dynamic","O"]]),
			"/som13/atom/movable/proc/Crossed": ffunc("Crossed","void",[["Ent_Dynamic","O"],["dynamic","X"]]),
			"/som13/atom/movable/proc/Move": ffunc("Move","bool",[["dynamic","NewLoc"],["int?","Dir"],["int","step_x"],["int","step_y"]]),
			"/som13/atom/movable/proc/Uncross": ffunc("Uncross","bool",[["Ent_Dynamic","O"]]),
			"/som13/atom/movable/proc/Uncrossed": ffunc("Uncrossed","void",[["Ent_Dynamic","O"]])
		},
		verbs: {}
	}

	data.classes["/som13/mob"] = {
		path: "/som13/mob",
		parent: "/obj",
		name: "Base_Mob",
		engine_side: true,
		vars: {
			ckey: ["raw_type","string"],
			client: ["raw_type","Client"],
			group: ["raw_type","ByTable"],
			key: ["raw_type","string"],
			see_in_dark: ["raw_type","int"],
			see_infrared: ["raw_type","bool"],
			see_invisible: ["raw_type","int"],
			sight: ["raw_type","int"]
		},
		vars_inherited: {},
		//vars_system: {},
		methods: {
			"/som13/mob/proc/Login": ffunc("Login","void",[]),
			"/som13/mob/proc/Logout": ffunc("Logout","bool",[]),
			"/som13/mob/proc/WriteMsg": ffunc("WriteMsg","void",["dynamic"])
		},
		verbs: {}
	}

	data.classes["/som13/area"] = {
		path: "/som13/area",
		parent: "/atom",
		name: "Base_Zone",
		engine_side: true,
		vars: {},
		vars_inherited: {},
		//vars_system: {},
		methods: {},
		verbs: {}
	}

	data.classes["/som13/turf"] = {
		path: "/som13/turf",
		parent: "/atom",
		name: "Base_Tile",
		engine_side: true,
		vars: {},
		vars_inherited: {},
		//vars_system: {},
		methods: {},
		verbs: {}
	}

	data.classes["/som13/image"] = {
		path: "/som13/image",
		parent: "/datum",
		name: "Base_Image",
		engine_side: true,
		vars: {
			// All of these concern the appearance.
			appearance: ["raw_type","Appearance"],
			appearance_flags: ["raw_type","int"],
			alpha: ["raw_type","int"],
			blend_mode: ["raw_type",,"int"],
			color: ["raw_type","string"],
			desc: ["raw_type","string"],
			gender: ["raw_type","string"],
			icon: ["raw_type","string"],
			icon_state: ["raw_type","string"],
			invisibility: ["raw_type","int"],
			infra_luminosity: ["raw_type","double"],
			layer: ["raw_type","double"],
			luminosity: ["raw_type","double"],
			maptext: ["raw_type","string"],
			maptext_width: ["raw_type","int"],
			maptext_height: ["raw_type","int"],
			maptext_x: ["raw_type","int"],
			maptext_y: ["raw_type","int"],
			mouse_over_pointer: ["raw_type","dynamic"],
			mouse_drag_pointer: ["raw_type","dynamic"],
			mouse_drop_pointer: ["raw_type","dynamic"],
			mouse_drop_zone: ["raw_type","bool"],
			mouse_opacity: ["raw_type","int"],
			name: ["raw_type","string"],
			opacity: ["raw_type","bool"],
			overlays: ["raw_type","ByTable"],
			override: ["raw_type","bool"], //(images only)
			pixel_x: ["raw_type","int"],
			pixel_y: ["raw_type","int"],
			pixel_z: ["raw_type","int"],
			plane: ["raw_type","int"],
			suffix: ["raw_type","string"],
			text: ["raw_type","string"],
			transform: ["raw_type","Matrix"],
			underlays: ["raw_type","ByTable"]
		},
		vars_inherited: {},
		//vars_system: {},
		methods: {

		},
		verbs: {},
		func_ctor: {
			args: ["icon","loc","icon_state","layer","dir","pixel_x","pixel_y"],
			vars: [],
			dc: []
		}
	}

	data.classes["/som13/matrix"] = {
		path: "/som13/matrix",
		parent: "/datum",
		name: "Base_Matrix",
		engine_side: true,
		vars: {},
		vars_inherited: {},
		//vars_system: {},
		methods: {},
		verbs: {}
	}

	data.classes["/datum"].name = "Game_Data"
	data.classes["/datum"].parent = "/som13/datum"

	data.classes["/atom"].name = "Ent_Static"
	data.classes["/atom"].parent = "/som13/atom"

	data.classes["/atom/movable"].name = "Ent_Dynamic"
	data.classes["/atom/movable"].parent = "/som13/atom/movable"

	data.classes["/area"].name = "Zone";
	data.classes["/area"].parent = "/som13/area";

	data.classes["/turf"].name = "Tile";
	data.classes["/turf"].parent = "/som13/turf";

	data.classes["/obj"].name = "Obj"

	data.classes["/mob"].name = "Mob"
	data.classes["/mob"].parent = "/som13/mob"

	data.classes["/client"].name = "Client"
	data.classes["/client"].parent = "/som13/client"

	data.classes["/image"].name = "Image"
	data.classes["/image"].parent = "/som13/image"

	data.classes["/matrix"].name = "Matrix"
	data.classes["/matrix"].parent = "/som13/matrix"

	// Figure out inheritance! -- Not sure this is even needed now.
	data.root_classes = [];
	data.map_classes = map_classes;
	data.map_libs = map_libs;

	for (var c_name in data.classes) {
		if (data.classes[c_name].parent)
			data.classes[c_name].parent = data.classes[data.classes[c_name].parent];
		data.classes[c_name].children=[];
		data.classes[c_name].v_names = {};
	}
	for (var c_name in data.classes) {
		var p = data.classes[c_name].parent;

		if (p==null)
			data.root_classes.push( data.classes[c_name] );
		else
			data.classes[p.path].children.push( data.classes[c_name] );
	}


	//Capitalize an identifier, removing underscores.
	function capit(s) {
		return s.replace(/(^|_)./g,function(s) {
			return s[s.length-1].toUpperCase();
		});//+"~";
	}


	// Name classes!
	for (var path in data.classes) {
		
		/*if (partial_classes[path]) {
			data.classes[path].name = partial_classes[path];
			data.classes[path].partial = true;

			var merge_base = map_classes[data.classes[path].name];

			for (var k in merge_base.vars) {
				data.classes[path].vars[k] = merge_base.vars[k];
			}

			for (var k in merge_base.v_names) {
				data.classes[path].v_names[k] = merge_base.v_names[k];
			}

			map_classes[data.classes[path].name] = data.classes[path];
		} else*/ 

		if (data.classes[path].name==null) {

			mod_path = path.replace(/^\/datum/,"");

			if (mod_path == path) {
				mod_path = mod_path.replace(/^\/atom\/movable/,"/Dynamic");

				if (mod_path == path) {
					mod_path = mod_path.replace(/^\/area/,"/Zone");

					if (mod_path == path) {
						mod_path = mod_path.replace(/^\/turf/,"/Tile");

						/*if (mod_path == path) {
							mod_path = mod_path.replace(/^\/obj/,"/Obj");
						}*/
					}
				}
			}
			

			var split_path = mod_path.split("/");

			var name = capit(split_path.pop());

			while (split_path.length>1) {
				name = capit(split_path.pop()) + "_" + name;
			}

			while (map_classes[name] || map_keywords[name])
				name= "_"+name;
			
			data.classes[path].name = name;
		}

		map_classes[data.classes[path].name] = data.classes[path];
	}

	// Add vars!
	for (var key in data.global_vars) {
		var name = unkeyword(key);

		data.global_vars[key] = new NodeVar(name,data.global_vars[key],true);
	}

	// Add procs!
	for (var key in data.global_funcs) {
		var name = unkeyword(key.split("/").pop());

		data.global_funcs[key].varData = new NodeVar(name,null,true);
		data.global_funcs[key].varData.type = "void";
		data.global_funcs[key].varData._const = false;
	}
}




var local_reserved = {"_default":true,"_args":true};
reserved_keywords.forEach(function(n) {local_reserved[n]=true;});

function name_locals(f) {
	if (f.locals_named)
		return;

	var used_names = {};

	function make_valid(name) {
		while (local_reserved[name]||name.substring(0,11)=="_loop_ctrl_"|| (name.length<=3 && name[0]=="_") )
			name= "_"+name;

		if (used_names[name]) {
			var nid = 2;
			while (used_names[name+nid]) {
				nid++;
			}
			name = name+nid;
		}

		used_names[name] = true;
		return name;
	}


	if (f.v_master!=null) {
		name_locals(f.v_master);

		for (var i=0;i<f.v_master.args.length;i++) {
			f.args[i] = f.v_master.args[i];
			used_names[f.args[i].name] = true;
		}
	} else {
		for (var i=0;i<f.args.length;i++) {
			f.args[i] = new NodeVar(make_valid(f.args[i]),null,false,true,true);
		}
	}

	for (var i=0;i<f.vars.length;i++) {
		f.vars[i] = new NodeVar(make_valid(f.vars[i]),null,false,true);
	}

	f.locals_named=true;
}




var banned_member_names = {"Equals":true,"GetHashCode":true,"GetType":true,"ToString":true};

reserved_keywords.forEach(function(kw) {
	banned_member_names[kw] = true;
});

/*

var banned_var_names = {"Equals":true,"GetHashCode":true,"GetType":true,"ToString":true};

reserved_keywords.forEach(function(kw) {
	banned_var_names[kw] = true;
});*/

function name_members(data) {
	data.g_v_name_map = g_v_name_map;
	data.g_var_name_map = g_var_name_map;

	function name_members_r(c,m,allow_verbs) {
		m = JSON.parse(JSON.stringify(m));

		if (c.path=="/client" || c.path=="/atom") {
			allow_verbs = true;
		}

		if (c.func_ctor) {
			c.func_ctor.varData = new NodeVar();
			c.func_ctor.varData.type = c.name;
			c.func_ctor.this_class = c;
			c.func_ctor.is_ctor = true;
		}

		if (c.func_init) {
			c.func_init.this_class = c;
		}

		for (var k in c.vars) {
			var name = k;

			submit_var_name(k,c);

			if (c.vars[k] instanceof NodeVar) {
				console.log("WOOP KILLME "+c.name);
				m[k] = true;
			} else {

				if (m[name] || name==c.name) {
					name = "v_"+name;
					while (m[name] || name==c.name)
						name = "_"+name;
				}

				var lock_type = false;
				if (c.vars[k] instanceof Array && c.vars[k][0]=="raw_type")
					lock_type=true;

				c.vars[k] = new NodeVar(name,c.vars[k]);
				if (lock_type) {
					c.vars[k].locked = true;
				}

				m[name] = true;
			}
		}

		for (var k in c.vars_inherited) {
			var p = c.parent;

			while (p!=null) {
				if (p.vars[k]) {
					p.vars[k].suggest(c.vars_inherited[k]);
					//console.log("hit! "+k);
					break;
				}
				p = p.parent;
			}
		}

		//console.log("==>")
		for (var k in c.methods) {
			if (k.indexOf("/proc/") !== -1) {
				var duplicate_k = k.replace("/proc/","/");
				if (c.methods[duplicate_k] != null ) {
					
					var name = k.split("/").pop();
					c.methods[k].varData = new NodeVar("_internal_"+name);
					c.methods[k].varData.type = "void";
					c.v_names[ "$_internal_" + c.methods[duplicate_k].verb_name ] = c.methods[k];
					m["_internal_"+name] = true;

					c.methods[duplicate_k].use_super_internal = true;

					//console.log("=> COLLISION ",k);
				}
			}
			//else
			//	console.log("NO.");
		}

		for (var k in c.methods) {
			c.methods[k].this_class = c;

			if (c.methods[k].verb_hint && allow_verbs)
				c.methods[k].verb_hint = false;

			if (c.methods[k].fake) {
				var base_name = k.split("/").pop();
				
				var v_name = "$"+base_name;
				c.v_names[v_name] = c.methods[k];
				submit_v_name(v_name,c);
			}
			else if (c.methods[k].varData == null) {

				var base_name = k.split("/").pop();
				var name = base_name;

				if (m[name] || name==c.name) {
					name = "f_"+name;
					while (m[name] || name==c.name)
						name = "_"+name;
				}

				var v_name = "$"+c.methods[k].verb_name; // "$"+base_name.replace(/_/g," ");
				c.v_names[v_name] = c.methods[k];
				submit_v_name(v_name,c);


				c.methods[k].varData = new NodeVar(name);
				c.methods[k].varData.type = "void";
				m[name] = true;
			} else
				continue

			//if (k == "/som13/datum/proc/Del")
			//	console.log("D2");

			//if (k=="/som13/datum/proc/Del")
			//	throw "))"+name+" "+v_name;
			
			var master = c.methods[k];
			var desc_arglist = master.uses_arglist;
			var slaves = [];
			function fixdesc_method(cc) {
				for (var kk in cc.methods) {
					var beta = kk.split("/").pop();

					if (base_name == beta) {
						cc.methods[kk].varData = c.methods[k].varData;
						cc.methods[kk].etc = "override ";
						cc.v_names[v_name] = cc.methods[k];
						if (cc.methods[kk].uses_arglist) desc_arglist = true;
						if (cc.methods[kk].args.length>master.args.length) {
							slaves.push(master);
							master = cc.methods[kk];
						//} else if (cc.methods[kk].args.length==master.args.length && master.fake) { // boot old master if it's fake and has bad arg names!
						//	slaves.push(master);
						//	master = cc.methods[kk];
						} else {
							slaves.push(cc.methods[kk]);
						}
					}
				}
				if (cc.v_names[v_name]==null)
					cc.v_names[v_name] = c.methods[k];

				cc.children.forEach(fixdesc_method);
			}
			
			c.children.forEach(fixdesc_method);

			master.uses_arglist = desc_arglist;

			if (slaves.length>0) {
				c.methods[k].etc = "virtual ";
				slaves.forEach(function(slave) {
					slave.v_master = master;
					slave.uses_arglist = desc_arglist;
				});
			}
		}

		for (var k in c.verbs) {
			c.verbs[k].this_class = c;
			c.verbs[k].verb_decl = true;

			if (c.verbs[k].verb_hint && allow_verbs)
				c.verbs[k].verb_hint = false;

			if (c.verbs[k].varData)
				continue;

			var base_name = k.split("/").pop();
			var name = base_name;

			if (m[name]  || name==c.name) {
				name = "f_"+name;
				while (m[name]  || name==c.name)
					name = "_"+name;
			}

			var v_name = "$"+c.verbs[k].verb_name;
			c.v_names[v_name] = c.verbs[k];

			c.verbs[k].varData = new NodeVar(name);
			c.verbs[k].varData.type = "void";
			m[name] = true;

			var master = c.verbs[k];
			var slaves = [];
			function fixdesc_verb(cc) {
				for (var kk in cc.verbs) {
					var beta = kk.split("/").pop();

					if (base_name == beta) {
						cc.verbs[kk].varData = c.verbs[k].varData;
						cc.verbs[kk].etc = "override ";
						cc.v_names[v_name] = cc.verbs[k];
						if (cc.verbs[kk].args.length>master.args.length) {
							slaves.push(master);
							master = cc.verbs[kk];
						} else {
							slaves.push(cc.verbs[kk]);
						}
					}
				}
				cc.children.forEach(fixdesc_verb);
			}
			c.children.forEach(fixdesc_verb);
			if (slaves.length>0) {
				c.verbs[k].etc = "virtual ";
				slaves.forEach(function(slave) {
					slave.v_master = master;
				});
			}
		}

		c.children.forEach(function(cc) {
			name_members_r(cc , m , allow_verbs);
		});
	}

	data.root_classes.forEach(function(rc) {
		name_members_r(rc , banned_member_names );
	});
}

/*
var vnames = {
	"$Find": "Find",
	"$Swap": "Swap",
	"$GetConfig": "GetConfig",
	"$New": "New",
	"$Cut": "Cut",
	"$Reboot": "Reboot",
	"$SetConfig": "SetConfig",
	"$IsByondMember": "IsSubscriber"
};

function name_members(data) {
	var banned_proc_names = {};

	for (var k in banned_var_names) {
		banned_proc_names[k]=true;
	}

	function do_vars(c) {
		var fixme = [];

		for (var k in c.vars) {
			var k2 = k.match(/^_*(.*)$/)[1];

			if (banned_var_names[k2]||k.substring(0,2)=="f_") {
				fixme.push(k);
				banned_proc_names["_"+k]=true;
			} else {
				banned_proc_names[k]=true;
			}
		}

		fixme.forEach(function(n) {
			var val = c.vars[n];
			delete c.vars[n];
			c.vars["_"+n] = val;
		});

		fixme = [];

		for (var k in c.vars_inherited) {
			var k2 = k.match(/^_*(.*)$/)[1];

			if (banned_var_names[k2]||k.substring(0,2)=="f_") {
				fixme.push(k);
				banned_proc_names["_"+k]=true;
			} else {
				banned_proc_names[k]=true;
			}
		}

		fixme.forEach(function(n) {
			var val = c.vars_inherited[n];
			delete c.vars_inherited[n];
			c.vars_inherited["_"+n] = val;
		});

		fixme = [];

		for (var k in c.//vars_system) { // I doubt any of these will cause any issues but there's always THAT ONE GUY.
			var k2 = k.match(/^_*(.*)$/)[1];

			if (banned_var_names[k2]||k.substring(0,2)=="f_") {
				fixme.push(k);
				banned_proc_names["_"+k]=true;
			} else {
				banned_proc_names[k]=true;
			}
		}

		fixme.forEach(function(n) {
			var val = c.//vars_system[n];
			delete c.//vars_system[n];
			c.//vars_system["_"+n] = val;
		});

		c.children.forEach(function(n) {
			do_vars(data.classes[n]);
		});
	}

	function do_procs(c) {
		for (var k in c.methods) {
			var fixed_name = k.split("/").pop();

			var v_name = "$"+fixed_name.replace(/_/g," ");

			if (banned_proc_names[fixed_name]) {
				fixed_name= "f_"+fixed_name;
			}

			vnames[v_name] = fixed_name;

			//c.methods[k]  .name = fixed_name;

			c.methods[k].varData = new NodeVar(fixed_name);
			c.methods[k].varData.type = "void";

			//names[fixed_name]="method";
		}

		for (var k in c.verbs) {
			var fixed_name = k.split("/").pop();

			//var v_name = "$"+fixed_name.replace("_"," ");

			if (banned_proc_names[fixed_name]) {
				fixed_name= "f_"+fixed_name;
			}

			//vnames[v_name] = fixed_name;

			//c.verbs[k].name = fixed_name;

			c.verbs[k].varData = new NodeVar(fixed_name);
			c.verbs[k].varData.type = "void";

			//names[fixed_name]="verb";
		}

		c.children.forEach(function(n) {
			do_procs(data.classes[n]);
		});
	}

	data.root_classes.forEach(function(n) {
		do_vars(data.classes[n]);
	});

	data.root_classes.forEach(function(n) {
		do_procs(data.classes[n]);
	});

	//throw "bows!";
	
	//console.log(data.classes)
}

function name_index(i) {
	if (banned_var_names[i]||i.substring(0,2)=="f_") {
		return "_"+i;
	}
	return i;
}
*/


exports.globals = name_globals; // {globals: name_globals};
exports.locals = name_locals;
exports.members = name_members;
exports.map_keywords = map_keywords;
//exports.name_index = name_index;
//exports.vnames = vnames;

exports.compute_types = compute_types;
exports.get_type = get_type;
exports.NodeVar = NodeVar;
exports.set_index = set_index;
exports.set_global_lock = set_global_lock;
//exports.set_block_suggest = set_block_suggest;