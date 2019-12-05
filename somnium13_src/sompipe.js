var fs = require("fs");


module.exports = function(file_name,index_name,out_name,finish_callback) {
	fs.readFile(file_name,function(err,json) {
		var dump = JSON.parse(json);

		//console.log(dump.keyvals.length);
		//console.log("<<",dump.m2.length);
		//console.log(">>",dump.m3.length);
		//console.log("~~",dump.f1.length);

		//console.log(dump.m3);
		//console.log(dump.f1.length);
		//throw "zz---"+dump.strs.indexOf("/obj/machinery/bot/secbot/turn_off");

		var convert_a = new Uint32Array(1);
		var convert_b = new Float32Array(convert_a.buffer)

		function get_val(t,n) {
			if (t==42) {
				convert_a[0]=n;
				return convert_b[0];
			} else if (t==6) {
				return dump.strs[n];
			} else if (t==8) {
				return ["class",dump.strs[dump.objs[dump.mobs[n].obj].str_path]];
			} else if (t==0) {
				return null
			} else if (t==9) {
				return ["class",dump.strs[dump.objs[n].str_path]];
			} else if (t==10) {
				return ["class",dump.strs[dump.objs[n].str_path]];
			} else if (t==11) {
				return ["class",dump.strs[dump.objs[n].str_path]];
				//return ["area",n];
			} else if (t==12) {
				return ["rsc",n];
			} else if (t==32) {
				return ["class",dump.strs[dump.objs[n].str_path]];
			} else if (t==38) {
				var dat_procname = dump.strs[dump.procs[n].str_path];

				if (dat_procname.substr(1,4)=="proc") { //add to global funcs list!
					if (out_data.global_funcs[dat_procname]==null) {
						out_data.global_funcs[dat_procname]="yodawg";
						out_data.global_funcs[dat_procname]=pipe_func(n);
					}
				}

				return ["proc",dat_procname];
			} else if (t==62) {

				//var a= dump.arrays[n];
				//check a len (should be 2)
				//if (a.length!=2)
				//	throw "ZOMBO";
				
				return null; //ctor init
			} else {
				//var err = new Error();
    			//console.log(err.stack);

				throw "DERP MAN "+t;
			}
		}

		function get_str(t,n) {
			var v = get_val(t,n);
			if (typeof(v)=="string") {
				return '"'+v+'"';
			}
			return v;
		}

		function read_val(a,i) {
			if (a[i]==42) {
				return [get_val(a[i],(a[i+1]<<16)+a[i+2]),3];
			} else if (a[i]==6) {
				return [get_val(a[i],a[i+1]),2];
			} else if (a[i]==8) {
				return [get_val(a[i],a[i+1]),2];
			} else if (a[i]==10) {
				return [["class",dump.strs[dump.objs[a[i+1]].str_path]],2];
			} else if (a[i]==36) {
				if (a[i+1]==0) {
					return ["SaveFile",2];
				}
				throw "unknowable3302"
			} else if (a[i]==38) {
				return [get_val(a[i],a[i+1]),2];
			} else if (a[i]==39) {
				if (a[i+1]==0) {
					return ["File",2];
				}
				throw "unknowable3301"
			} else if (a[i]==40) {
				//console.log(dump.strs[dump.objs[a[i+1]].str_path]);
				//var err = new Error();
    			//console.log(err.stack);
				//throw "--"
				//return [["class",dump.strs[dump.objs[dump.mobs[a[i+1]].obj].str_path]],2];
				return [["list_ctor",a[i+1]],2];
			} else if (a[i]==59) {
				return [["client"],2];
			} else if (a[i]==62) {
				return [null,2];
			} else if (a[i]==63) {
				return [["class",dump.strs[dump.objs[a[i+1]].str_path]],2];
			} else if (a[i]==11) {
				return [["class",dump.strs[dump.objs[a[i+1]].str_path]],2];

				//return [["area",a[i+1]],2];
			} else if (a[i]==12) {
				return [["rsc",a[i+1]],2];
			} else if (a[i]==41) {
				var initializer_entry = dump.m3[a[i+1]];
				var initializer_path;
				if (initializer_entry[0]==8) {
					initializer_path = dump.strs[dump.objs[dump.mobs[initializer_entry[1]].obj].str_path]
				} else {
					initializer_path = dump.strs[dump.objs[initializer_entry[1]].str_path]
				}

				var initializer_id = initializer_entry[2];

				if (out_data.initializers[initializer_id]==null) {
					out_data.initializers[initializer_id]="yodawg";
					out_data.initializers[initializer_id]=pipe_func(initializer_id);
					out_data.initializers[initializer_id].type="initializer";
				}

				return [["initializer",initializer_path,initializer_id],2];
			} else if (a[i]==0) {
				return [null,2];
			} else if (a[i]==9) {
				return [get_val(a[i],a[i+1]),2];
			} else if (a[i]==32) {
				return [["class",dump.strs[dump.objs[a[i+1]].str_path]],2];
			} else if (a[i]==262) {
				//console.log("##",dump.strs.indexOf("#1c1c1c"));
				return [dump.strs[65536+a[i+1]],2];
			} else if (a[i]==255) {
				return ["~BADVAL~"+a[i+1],2];
			} else {
				//var err = new Error();
    			//console.log(err.stack);

				throw "EEEEE "+a[i]+" "+a[i+1]+" "+a[i+2]+" "+a[i+3]+" "+a[i+4]+" "+a[i+5]+" "+a[i+6]+" "+a[i+7];
			}
		}

		function read_str(a,i) {
			var v = read_val(a,i);
			if (typeof(v[0])=="string") {
				v[0] = '"'+v[0]+'"';
			}
			return v;
		}



		var out_data = {};
		out_data.world = {};
		out_data.global_vars = {};
		out_data.global_funcs = {};
		out_data.classes = {};
		out_data.initializers = {};

		function pipe_func(f_index) {
			var f = dump.procs[f_index];

			if (f==null)
				return;

			var out_func = {};

			out_func.path = dump.strs[f.str_path];

			out_func.args=[];
			out_func.vars=[];

			//console.log("@@",out_func.path);

			//console.log(out_func.path)
			//out_func.code=[];

			//console.log(f);
			//if (dump.strs[f.str_path]=="/sound/New")
			//	throw "HALT";

			//console.log(dump.strs[f.str_path] || "@proc_"+f_index);

			//console.log("\t[ARGS]");

			out_func.arg_info = [];

			var args = dump.arrays[f.args];

			if (args.length%4!=0)
				throw "SMALL MEMES SMALL MONEY!";

			for (var i=0;i<args.length;i+=4) {
				var arg_info_1 = args[i];
				var arg_info_2 = args[i+1];
				var arg_info_3 = args[i+3];

				//if (args[i+1]!=32001 || args[i+3]!=0) verb 'in' clause!
				//	throw "SMALLER MEMES SMALLER MONEY!"+dump.strs[dump.keyvals[args[i]][2]]+" "+args[i+1]+" "+args[i+3];
				var kv = dump.keyvals[args[i+2]];

				if (kv[0]!=0 || kv[1]!= 0)
					throw "SMALLEST MEMES SMALLEST MONEY!";
				
				//console.log("~> ",t,dump.strs[kv[2]]);

				out_func.args.push(dump.strs[kv[2]]);

				/*if (arg_info_2>32000) {
					arg_info_2 = null;
				} else {
					arg_info_2 = pipe_func(arg_info_2);
				}*/
				out_func.arg_info.push([arg_info_1, arg_info_2, arg_info_3]);
				//console.log("\t\t"+i/4+": "+dump.strs[kv[2]]+" (t="+t+")");
			}

			//console.log(p.str[f.str_path],args);
			//console.log();

			//console.log("\t[VARS]");

			dump.arrays[f.vars].forEach(function(n,i) {
				var kv = dump.keyvals[n];

				if (kv[0]!=0 || kv[1]!= 0)
					throw "SMALLEST VARS SMALLEST DINGUS! "+kv[0]+" "+kv[1];

				out_func.vars.push(dump.strs[kv[2]]);
				//console.log("\t\t"+i+": "+dump.strs[kv[2]]); //todo check other parts of m
			});

			if (f.str_name!=65535) 
				out_func.verb_name = dump.strs[f.str_name];
			if (f.ic!=65535)
				out_func.verb_desc = dump.strs[f.ic];
			if (f.id!=65535)
				out_func.verb_cat = dump.strs[f.id];
			if (f.ca!=-1)
				out_func.verb_range = f.ca;

			if (out_func.verb_desc!=null || out_func.verb_cat != null) {
				out_func.verb_hint = true;
			}

			out_func.verb_access = f.cb;

			out_func.flags_1 = f.cc;
			out_func.flags_2 = f.ja;
			out_func.flags_3 = f.jb;

			//console.log("\t[CODE]");

			var code = dump.arrays[f.code];
			var code_rep = [];
			var code_ids = [];

			var i = 0;

			function get_operand() {
				//console.log("@ "+code[i]+" "+code[i+1]+" "+code[i+2]+" "+code[i+3]+" "+code[i+4]+" "+code[i+5]+" "+code[i+6]+" "+code[i+7]+" "+code[i+8]+" "+code[i+9]);
				//console.log(dump.strs.indexOf("ÿ\u0002 stumbles over ÿ\u0001!"));

				i++;
				switch (code[i++]) {
					//case 37:
					//	return ["goofy",1];
					/*case 37:
						return ["member_prev", dump.strs[37] ]
					case 1970:
						return ["member_prev", dump.strs[1970] ]
					case 1971:
						return ["member_prev", dump.strs[1971] ]
					case 3684:
						return ["goofy",2];
					case 3919:
						return ["member_prev", dump.strs[3919] ]
					case 3921:
						return ["member_prev", dump.strs[3921] ]*/

					case 65497:
						return ["arg",code[i++]];
					case 65485:
						return ["usr"];
					case 65486:
						return ["src"];
					case 65487:
						out_func.uses_arglist = true;
						return ["args"];
					case 65488:
						out_func.uses_defret = true;
						return ["defret"];
					case 65498:
						return ["local",code[i++]];
					case 65499:
						var glob_kv = dump.keyvals[code[i++]];

						var glob_key = dump.strs[glob_kv[2]];

						if (out_data.global_vars[glob_key]==null)
							out_data.global_vars[glob_key]= get_val(glob_kv[0],glob_kv[1]);

						return ["global",glob_key];

					case 65501:
						return ["member_prev","$"+dump.strs[code[i++]]]; //dollar proc

					case 65500: // This is objectively the worst thing ever.

						//console.log("enter ",code[i],code[i+1],code[i+2],code[i+3],code[i+4],code[i+5],code[i+6],code[i+7],code[i+8])

						var chain = [];

						i--;
						var result = ["member",get_operand(),chain]

						for (;;) {
							//result.push(code[i]);
							//console.log(code[i]);
							if (code[i]==65500) {
								i++;
								if (code[i]==65499) { //whoever designed this is a sadistic bastard
									var glob_kv = dump.keyvals[code[++i]];

									var glob_key = dump.strs[glob_kv[2]];

									if (out_data.global_vars[glob_key]==null)
										out_data.global_vars[glob_key]= get_val(glob_kv[0],glob_kv[1]);

									result[1] = ["global",glob_key];

									i++;
								} else if (code[i]==65486) {
									//throw "R U FUKN KIDDING ME?"
									i++; //skip this shit
								} else {
									var str = dump.strs[code[i++]];
									if (str!=null)
										chain.push(str);
								}
							} else if (code[i]==65501) {
								i++; //wuto wut
								var str = dump.strs[code[i++]];
								if (str!=null)
									chain.push("$"+str); // goofy, goofy fucking call

								return result;

								//throw "teemo plz "+out_func.path;
							} else if (code[i]==65502) { //IT'S A FUCKING VERB!!!
								i++; //wuto wut
								var str = dump.strs[code[i++]];
								//console.log(dump.strs.indexOf("cancel_camera"));
								//console.log(">>"+code[i-1],dump.strs.);
								if (str!=null)
									chain.push("%"+str);

								return result;
							} else if (code[i]==65503) {
								//return [code[i++],code[i++],code[i++],code[i++],code[i++]]
								i++;
								var str = dump.strs[dump.procs[code[i++]].str_path];
								chain.push(str);
								return result;
							} else if (code[i]==65504) { //THIS IS SUPER BROKEN BUT IGNORE IT FOR NOW!
								i++;
								var str = dump.strs[dump.procs[code[i++]].str_path];
								chain.push(str);
								return result;
								//ugh
							} else if (code[i]==65511) {
								//console.log(code[i],code[i+1],code[i+2]);
								i++;
								var str = dump.strs[code[i++]];
								chain.push(str);

								return ["initial",result]

								//return "yo";
								//throw "---"

							} else if (dump.strs[code[i]]) {
								chain.push(dump.strs[code[i++]]);
								return result;
							} else {
								//console.log("---<>",result)
								//throw "fuck this code--"+code[i];
								return result;
							}
							//console.log(chain);
						}

						/*for (;;) {
							console.log("i "+result)
							/*if (dump.strs[code[i]]=="") {
								//console.log("--------------DD")
								i++;
								break;
							} else if (dump.strs[code[i]]!==null) {
								result= "mem "+dump.strs[code[i++]]+" "+result
								break;
							} else {
								result= get_operand()+result
							}
						}*/

						//console.log(">>>> "+result);

						//return result
					case 65502:
						var str = dump.strs[code[i++]];
						return ["member_prev","%"+str];

					case 65503:
						//console.log(dump.strs.indexOf("unbuckle_mob"));
						var str = dump.strs[dump.procs[code[i++]].str_path];
						return ["member_prev",str]; //proc path
					case 65504:
						var str = dump.strs[dump.procs[code[i++]].str_path];
						return ["member_prev",str];
						//console.log(">>>>>>>>>>>>>>>>>>>>>",str);
						//throw "000";
					case 65507:
						if (code[i++]!=52||code[i++]!=65496)
							throw "this that shit i dont like";
						//throw "ballzzz"
						return ["list_index"];
					case 65508:
						return ["pop"];
					case 65509:
						return ["world"];
					//case 65507:
					//	return ["list_index"];
					case 65510:
						return ["null"];
					case 65511:
						i--;
						return ["initial",get_operand()];
					case 65512:
						i--;
						return ["issaved",get_operand()];
					/*case 67133:
						console.log(dump.strs[67133]);
						throw "OH NO";
						//return ["<-->"];*/
					default:
						var i2 = i-1;
						if (code[i2] < 61000 || code[i2] > 60599) {
							return ["member_prev", dump.strs[code[i2]] ] //var
						}
						i=1/0;
						return ["?",code[i2],code[i2+1],code[i2+2],code[i2+3],code[i2+4],code[i2+5],code[i2+6]];
				}
			}

			while (i<code.length) {
				code_ids.push(i);
				switch (code[i]) {
					case 0:
						code_rep.push(["return"]);
						i++;
						break;
					case 1:
						code_rep.push(["call","new",null,code[i+1]]);
						i+=2;
						break;
					case 2:
						code_rep.push(["sub","push",dump.strs[code[i+1]],code[i+2]]);
						i+=3;
						break;
					case 3:
						code_rep.push(["io","write"]);
						i++;
						break;
					case 4:
						code_rep.push(["sub","write",dump.strs[code[i+1]],code[i+2]]);
						i+=3;
						break;
					case 5:
						code_rep.push(["pop","cond","alt"]);
						i++;
						break;

					//BREAK

					case 7:
						code_rep.push(["std","link"]);
						i++;
						break;

					case 8:
						code_rep.push(["std","ftp"]);
						i++;
						break;

					case 9:
						code_rep.push(["std","run"]);
						i++;
						break;

					//case 6:
					//	code_rep.push(["jmp","wtf",6]);
					//	i++;
					//	break;
					//BREAK

					//case 11:
					//	code_rep.push(["list","in_to"]);
					//	i++;
					//	break;
					case 12:
						code_rep.push(["del"]);
						i++;
						break;
					case 13:
						code_rep.push(["pop","cond"]);
						i++;
						break;
					case 14:
						code_rep.push(["un","!"]);
						i++;
						break;
					case 15:
						code_rep.push(["jmp","fwd",code[i+1]]);
						i+=2;
						break;
					//BREAK
					case 17:
						code_rep.push(["jmp","false",code[i+1]]);
						i+=2;
						break;
					case 18:
						code_rep.push(["return","pop"]);
						i++;
						break;
					case 19:
						code_rep.push(["std","isloc"]);
						i++;
						break;
					case 20:
						code_rep.push(["std","ismob"]);
						i++;
						break;
					case 21:
						code_rep.push(["std","isobj"]);
						i++;
						break;
					case 22:
						code_rep.push(["std","isarea"]);
						i++;
						break;
					case 23:
						code_rep.push(["std","isturf"]);
						i++;
						break;
					case 24:
						code_rep.push(["std","alert"]);
						i++;
						break;
					case 25:
						code_rep.push(["list","new_oflen"]);
						i++;
						break;
					case 26:
						code_rep.push(["list","new",code[i+1]]);
						i+=2;
						break;
					case 27:
						code_rep.push(["std","view"]);
						i++;
						break;
					case 28:
						code_rep.push(["std","oview"]);
						i++;
						break;

					//BREAK
					case 31:
						code_rep.push(["std","block"]);
						i++;
						break;

					//BREAK
					case 33:
						code_rep.push(["std","prob"]);
						i++;
						break;
					case 34:
						code_rep.push(["std","rand1"]);
						i++;
						break;
					case 35:
						code_rep.push(["std","rand"]);
						i++;
						break;
					case 36:
						code_rep.push(["std","sleep"]);
						i++;
						break;
					case 37:
						code_rep.push(["jmp","spawn",code[i+1]]);
						i+=2;
						break;

					//BREAK

					//case 39:
					//	code_rep.push(["std","initial"]);
					//	i++;
					//	break;

					//BREAK
					case 39:
						code_rep.push(["std","browse_rsc"]);
						i++;
						break;
					case 40:
						code_rep.push(["std","isicon"]);
						i++;
						break;
					case 41:
					case 42: //do these differ at all?!?
						//code_rep.push(["call","member",code[i++],code[i++],code[i++],code[i++],code[i++],code[i++],code[i++]]);
						code_rep.push(["call","member",get_operand(),code[i++]]);
						break;
					case 43:
						code_rep.push(["call","direct",null,code[i+1]]);
						i+=2;
						break;
					case 44:
						code_rep.push(["call","super",null,0]);
						i++;
						break;
					case 45: // is this correct?
						code_rep.push(["call","super",null,code[i+1]]);
						i+=2;
						break;
					case 46:
						code_rep.push(["call","this",null,0]);
						i++;
						break;
					case 47:
						code_rep.push(["call","this",null,code[i+1]]);
						i+=2;
						break;
					case 48:
						var called_path = dump.strs[dump.procs[code[i+2]].str_path];

						if (out_data.global_funcs[called_path]==null) {
							out_data.global_funcs[called_path]="yodawg";
							out_data.global_funcs[called_path]=pipe_func(code[i+2]);
							out_data.global_funcs[called_path].type="global";
						}

						code_rep.push(["call","global",called_path,code[i+1]]);
						i+=3;
						break;
					case 49:
						code_rep.push(["std","log"]);
						i++;
						break;
					case 50:
						code_rep.push(["std","log2"]);
						i++;
						break;
					//BREAK
					case 51:
						try {
							code_rep.push(["push",get_operand()]);
						}
						catch(dasd) {
							throw "GOT ONE B0SS "+dasd;
						}
						break;
					case 52:
						code_rep.push(["asn","=",get_operand()]);
						break;
					//BREAK
					case 54:
						code_rep.push(["push","cond"]);
						i++;
						break;		
					case 55:
						code_rep.push(["cmp","=="]); //special! sets cond and pushes garbage(?)
						i++;
						break;	
					case 56:
						code_rep.push(["cmp","!="]); //seems to work like others (WTF)
						i++;
						break;	
					case 57:
						code_rep.push(["cmp","<"]);
						i++;
						break;
					case 58:
						code_rep.push(["cmp",">"]);
						i++;
						break;
					case 59:
						code_rep.push(["cmp","<="]);
						i++;
						break;
					case 60:
						code_rep.push(["cmp",">="]);
						i++;
						break;
					case 61:
						code_rep.push(["un","-"]);
						i++;
						break;
					case 62:
						code_rep.push(["bi","+"]);
						i++;
						break;
					case 63:
						code_rep.push(["bi","-"]);
						i++;
						break;
					case 64:
						code_rep.push(["bi","*"]);
						i++;
						break;
					case 65:
						code_rep.push(["bi","/"]);
						i++;
						break;
					case 66:
						code_rep.push(["bi","%"]);
						i++;
						break;
					case 67:
						code_rep.push(["std","round"]);
						i++;
						break;
					case 68:
						code_rep.push(["std","round2"]);
						i++;
						break;
					case 69:
						code_rep.push(["asn","+=",get_operand()]);
						break;
					case 70:
						code_rep.push(["asn","-=",get_operand()]);
						break;
					case 71:
						code_rep.push(["asn","*=",get_operand()]);
						break;
					case 72:
						code_rep.push(["asn","/=",get_operand()]);
						break;
					case 73:
						code_rep.push(["asn","%=",get_operand()]);
						break;
					case 74:
						code_rep.push(["asn","&=",get_operand()]);
						break;
					case 75:
						code_rep.push(["asn","|=",get_operand()]);
						break;
					case 76:
						code_rep.push(["asn","^=",get_operand()]);
						break;
					case 77:
						code_rep.push(["asn","<<=",get_operand()]);
						break;
					case 78:
						code_rep.push(["asn",">>=",get_operand()]);
						break;
					//BREAK
					case 80:
						code_rep.push(["push","val",code[i+1]]);
						i+=2;
						break;
					case 81:
						code_rep.push(["pop"]);
						i++;
						break;
					case 82:
						code_rep.push(["list","for_pop",code[i+1],code[i+2]]); //TODO WHAT ARE THESE THINGS?
						//if (code[i+1]!=5 || code[i+2]!=0)
						//	throw "???? :D";
						i+=3;
						break;
					case 83:
						code_rep.push(["list","for_push"]);
						i++;
						break;
					case 84:
						code_rep.push(["list","for_nested"]);
						i++;
						break;
					case 85:
						code_rep.push(["list","for_nested_end"]);
						i++;
						break;
					case 86:
						code_rep.push(["std","num2text2"]);
						i++;
						break;

					//BREAK

					case 89:
						code_rep.push(["std","range_a"]);
						i++;
						break;
					case 90:
						code_rep.push(["std","locate3"]);
						i++;
						break;
					case 91:
						code_rep.push(["std","locate1"]);
						i++;
						break;
					case 92:
						code_rep.push(["std","flick"]);
						i++;
						break;
					case 93:
						code_rep.push(["std","shutdown"]);
						i++;
						break;
						
					//BREAK
					case 96:
						i++;
						var r;
						try {
							r = read_val(code,i);
						} catch(sdagfafd) {
							code_rep.push(["push","unknowable",sdagfafd]);
							i=1/0;
							break;
							//console.log(code_rep);
							//throw ",,,,,"+sdagfafd
						}
						code_rep.push(["push","val",r[0]]);
						i+=r[1];
						break;
					case 97:
						code_rep.push(["std","image"]);
						i++;
						break;
					case 98:
						code_rep.push(["asn","++pre",get_operand()]);
						break;
					case 99:
						code_rep.push(["asn","++post",get_operand()]);
						break;
					case 100:
						code_rep.push(["asn","--pre",get_operand()]);
						break;
					case 101:
						code_rep.push(["asn","--post",get_operand()]);
						break;
					case 102:
						code_rep.push(["asn","++",get_operand()]);
						break;
					case 103:
						code_rep.push(["asn","--",get_operand()]);
						break;
					case 104:
						code_rep.push(["std","abs"]);
						i++;
						break;
					case 105:
						code_rep.push(["std","sqrt"]);
						i++;
						break;
					case 106:
						code_rep.push(["bi","**"]);
						i++;
						break;
					case 107:
						code_rep.push(["std","turn"]);
						i++;
						break;
					case 108:
						code_rep.push(["std","cat",code[i+1]]);
						i+=2;
						break;
					case 109:
						code_rep.push(["std","length"]);
						i++;
						break;
					case 110:
						code_rep.push(["std","copytext"]);
						i++;
						break;
					case 111:
						code_rep.push(["std","findtext"]);
						i++;
						break;
					case 112:
						code_rep.push(["std","findtextEx"]);
						i++;
						break;
					case 113:
						code_rep.push(["std","cmptext"]);
						i++;
						break;
					case 114:
						code_rep.push(["std","sorttext",code[i+1]]);
						i+=2;
						break;
					//BREAK
					case 116:
						code_rep.push(["std","uppertext"]);
						i++;
						break;
					case 117:
						code_rep.push(["std","lowertext"]);
						i++;
						break;
					case 118:
						code_rep.push(["std","text2num"]);
						i++;
						break;
					case 119:
						code_rep.push(["std","num2text"]);
						i++;
						break;
					case 120:
						var count = code[i+1];
						i+=2;
							
						var cases = [];

						for (var j=0;j<count;j++) {
							//console.log(">");
							var r = read_val(code,i);
							//console.log("<");

							i+=r[1];

							cases.push([r[0],code[i++]]);
						}

						code_rep.push(["switch",{cases: cases,def: code[i++]}]);

						break;
					case 121:
						var count = code[i+1];
						i+=2;
							
						var cases = [];

						for (var j=0;j<count;j++) {
							//console.log(">");
							//var r = read_val(code,i);
							//console.log("<");

							//i++;

							cases.push([code[i++],code[i++]]);
						}

						code_rep.push(["pick","static",{cases: cases,def: code[i++]}]);

						break;
					/*case 121:
						var cnt = code[++i];
						bullshit = [];
						for (var icc=0;icc<cnt;icc++) {
							bullshit.push(code[++i]);
							bullshit.push(code[++i]);
						}

						code_rep.push(["std","pick",cnt,bullshit]);
						i++;
						i++;
						break;*/
					case 122:
						var count = code[i+1];
						i+=2;
							
						var ranges = [];

						for (var j=0;j<count;j++) {
							//console.log(">>");
							var r = read_val(code,i);
							//console.log("<<");

							i+=r[1];

							var v1 = r[0];
							//console.log(">>");
							var r = read_val(code,i);
							//console.log("<<");
							i+=r[1];

							ranges.push([v1,r[0],code[i++]]);
						}

						var count = code[i++];

						var cases = [];

						for (var j=0;j<count;j++) {
							//console.log(">>");
							var r = read_val(code,i);
							//console.log("<<");

							i+=r[1];

							cases.push([r[0],code[i++]]);
						}

						//console.log("-] "+code[i++]);

						code_rep.push(["switch",{ranges: ranges, cases: cases,def: code[i++]}]);

						break;
					case 123:
						code_rep.push(["list","get"]);
						i++;
						break;
					case 124:
						code_rep.push(["list","set"]);
						i++;
						break;
					case 125:
						code_rep.push(["std","istype"]);
						i++;
						break;
					case 126:
						code_rep.push(["bi","&"]);
						i++;
						break;
					case 127:
						code_rep.push(["bi","|"]);
						i++;
						break;
					case 128:
						code_rep.push(["bi","^"]);
						i++;
						break;
					case 129:
						code_rep.push(["un","~"]);
						i++;
						break;
					case 130:
						code_rep.push(["bi","<<"]);
						i++;
						break;
					case 131:
						code_rep.push(["bi",">>"]);
						i++;
						break;
					case 132:
						code_rep.push(["dbg","file",dump.strs[code[i+1]]]);
						i+=2;
						break;
					case 133:
						code_rep.push(["dbg","line",code[i+1]]);
						i+=2;
						break;
					case 134:
						code_rep.push(["std","step"]);
						i++;
						break;
					case 135:
						code_rep.push(["std","step_to"]);
						i++;
						break;
					case 136:
						code_rep.push(["std","step_away"]);
						i++;
						break;
					case 137:
						code_rep.push(["std","step_towards"]);
						i++;
						break;
					case 138:
						code_rep.push(["std","step_rand"]);
						i++;
						break;
					case 139:
						code_rep.push(["std","walk"]);
						i++;
						break;
					case 140:
						code_rep.push(["std","walk_to"]);
						i++;
						break;
					case 141:
						code_rep.push(["std","walk_away"]);
						i++;
						break;
					case 142:
						code_rep.push(["std","walk_towards"]);
						i++;
						break;
					//BREAK
					case 144:
						code_rep.push(["std","get_step"]);
						i++;
						break;
					case 145:
						code_rep.push(["std","get_step_to"]);
						i++;
						break;
					case 146:
						code_rep.push(["std","get_step_away"]);
						i++;
						break;
					case 147:
						code_rep.push(["std","get_step_towards"]);
						i++;
						break;
					case 148:
						code_rep.push(["std","get_step_rand"]);
						i++;
						break;
					case 149:
						code_rep.push(["std","get_dist"]);
						i++;
						break;
					case 150:
						code_rep.push(["std","get_dist2"]);
						i++;
						break;
					case 151:
						code_rep.push(["std","locate_in"]);
						i++;
						break;
					case 152:
						code_rep.push(["std","shell"]);
						i++;
						break;
					case 153:
						code_rep.push(["std","text2file"]);
						i++;
						break;
					case 154:
						code_rep.push(["std","file2text"]);
						i++;
						break;
					case 155:
						code_rep.push(["std","fcopy"]);
						i++;
						break;
					//BREAK
					case 158:
						code_rep.push(["std","isnull"]);
						i++;
						break;
					case 159:
						code_rep.push(["std","isnum"]);
						i++;
						break;
					case 160:
						code_rep.push(["std","istext"]);
						i++;
						break;

					case 161:
						code_rep.push(["std","stat_panel3"]);
						i++;
						break;

					case 162:
						code_rep.push(["std","stat_panel"]);
						i++;
						break;

					//BREAK
					case 165:
						code_rep.push(["std","min",code[i+1]]);
						i+=2;
						break;
					case 166:
						code_rep.push(["std","max",code[i+1]]);
						i+=2;
						break;
					case 167:
						code_rep.push(["std","typesof",code[i+1]]);
						i+=2;
						break;
					//BREAK
					case 168:
						code_rep.push(["std","ckey"]);
						i++;
						break;
					case 169:
						if (code[i+1]==5) {
							code_rep.push(["list","in"]);
						} else if (code[i+1]==11) {
							code_rep.push(["list","in","to"]);
						} else {
							console.log(code[i+1]);
							throw "~~";
						}
						i+=2;
						break;
					//BREAK
					case 171:
						code_rep.push(["std","browse"]);
						i++;
						break;
					case 172:
						code_rep.push(["std","flist"]);
						i++;
						break;
					case 173:
						code_rep.push(["std","orange"]);
						i++;
						break;
					case 174:
						code_rep.push(["std","range_b"]);
						i++;
						break;
					case 175:
						code_rep.push(["io","read"]);
						i++;
						break;
					case 176:
						code_rep.push(["list","goofy"]);
						i++;
						break;
					case 177:
						var count = code[i+1];
						i+=2;
							
						var cases = [];

						for (var j=0;j<count-1;j++) {
							//console.log(">");
							//var r = read_val(code,i);
							//console.log("<");

							//i++;

							cases.push([null,code[i++]]);
						}

						//console.log("-------------------------------------------------------->",cases);

						code_rep.push(["pick","dynamic",{cases: cases,def: code[i++]}]);

						break;
					case 178:
						code_rep.push(["jmp","||",code[i+1]]); //IF NO JUMP, POP TOP
						i+=2;
						break;
					case 179:
						code_rep.push(["jmp","&&",code[i+1]]); //IF NO JUMP, POP TOP
						i+=2;
						break;
					case 180:
						code_rep.push(["std","fdel"]);
						i++;
						break;
					case 181:
						code_rep.push(["call","getf2",null,code[i+1]]); //IF NO JUMP, POP TOP
						i+=2;
						break;
					//BREAK
					case 183:
						code_rep.push(["std","list2params"]);
						i++;
						break;
					case 184:
						code_rep.push(["std","params2list"]);
						i++;
						break;
					case 185:
						code_rep.push(["std","ckeyEx"]);
						i++;
						break;
					//BREAK
					case 187:
						code_rep.push(["std","rgb"]);
						i++;
						break;
					case 188:
						code_rep.push(["std","hascall"]);
						i++;
						break;
					//BREAK
					case 190:
						code_rep.push(["std","html_encode"]);
						i++;
						break;
					case 191:
						code_rep.push(["std","html_decode"]);
						i++;
						break;
					case 192:
						code_rep.push(["std","time2text"]);
						i++;
						break;
					case 193:
						code_rep.push(["std","input",code[i+1],code[i+2],code[i+3],code[i+4]]);
						i+=5;
						break;
					case 194:
						code_rep.push(["std","sin"]);
						i++;
						break;
					case 195:
						code_rep.push(["std","cos"]);
						i++;
						break;
					case 196:
						code_rep.push(["std","arcsin"]);
						i++;
						break;
					case 197:
						code_rep.push(["std","arccos"]);
						i++;
						break;
					case 198:
						code_rep.push(["std","input_alt",code[i+1],code[i+2],code[i+3],code[i+4]]);
						i+=5;
						break;
					case 199:
						code_rep.push(["std","crash"]);
						i++;
						break;
					case 200:
						code_rep.push(["list","new_assoc",code[i+1]]);
						i+=2;
						break;
					case 201:
						code_rep.push(["call","super_list"]);
						i++;
						break;
					//BREAK

					case 203:
						code_rep.push(["call","getf_list"]);
						i++;
						break;
					case 204:
						code_rep.push(["call","getf2_list"]);
						i++;
						break;
					case 205:
						var called_path = dump.strs[dump.procs[code[i+1]].str_path];
						//console.log("smarter pipe?", dump.strs[dump.procs[code[i+1]].str_path] )
						if (out_data.global_funcs[called_path]==null) {
							out_data.global_funcs[called_path]="yodawg";
							out_data.global_funcs[called_path]=pipe_func(code[i+1]);
							out_data.global_funcs[called_path].type="global";
						}

						code_rep.push(["call","list",called_path]);

						i+=2;
						break;
					//BREAK

					case 207:
						code_rep.push(["call","new_list"]);
						i++;
						break;
					case 208:
						code_rep.push(["std","min_listcall"]);
						i++;
						break;
					case 209:
						code_rep.push(["std","max_listcall"]);
						i++;
						break;
					case 210:
						code_rep.push(["std","pick_list"]);
						i++;
						break;
					case 211:
						code_rep.push(["std","image_listcall"]);
						i++;
						break;
					case 212:
						code_rep.push(["std","image_n",code[i+1]]);
						i+=2;
						break;

					//BREAK

					case 215:
						code_rep.push(["std","fcopy_rsc"]);
						i++;
						break;

					//BREAK

					case 219:
						code_rep.push(["std","text2ascii"]);
						i++;
						break;
					case 220:
						code_rep.push(["std","ascii2text"]);
						i++;
						break;
					case 221:
						code_rep.push(["std","icon_states"]);
						i++;
						break;
					case 222:
						code_rep.push(["std","icon",code[i+1]]);
						i+=2;
						break;
					case 223:
						code_rep.push(["std","icon_oper",code[++i],get_operand()]);
						i+=2;
						break;

					case 225:
						code_rep.push(["std","icon_oper_set_intensity",get_operand()]);
						i++;
						break;
					case 226:
						code_rep.push(["std","icon_oper_swap_color",get_operand()]);
						i++;
						break;
					case 227:
						code_rep.push(["std","icon_oper_shift",get_operand()]);
						i++;
						break;

					case 228:
						code_rep.push(["std","isfile"])
						i++;
						break;

					case 229:
						code_rep.push(["std","viewers"])
						i++;
						break;
					case 230:
						code_rep.push(["std","oviewers"])
						i++;
						break;
					case 231:
						code_rep.push(["std","hearers"])
						i++;
						break;
					case 232:
						code_rep.push(["std","ohearers"])
						i++;
						break;
					case 233:
						code_rep.push(["std","_dm_db_new_con"])
						i++;
						break;
					case 234:
						code_rep.push(["std","_dm_db_new_query"])
						i++;
						break;
					case 235:
						code_rep.push(["std","_dm_db_connect"])
						i++;
						break;
					case 236:
						code_rep.push(["std","_dm_db_execute"])
						i++;
						break;
					case 237:
						code_rep.push(["std","_dm_db_next_row"])
						i++;
						break;
					case 238:
						code_rep.push(["std","_dm_db_error_msg"])
						i++;
						break;
					case 239:
						code_rep.push(["std","_dm_db_close"])
						i++;
						break;
					case 240:
						code_rep.push(["std","_dm_db_is_connected"])
						i++;
						break;
					case 241:
						code_rep.push(["std","_dm_db_rows_affected"])
						i++;
						break;
					case 242:
						code_rep.push(["std","_dm_db_row_count"])
						i++;
						break;
					case 243:
						code_rep.push(["std","_dm_db_quote"])
						i++;
						break;
					case 244:
						code_rep.push(["std","_dm_db_columns"])
						i++;
						break;
					case 245:
						code_rep.push(["std","ispath"]);
						i++;
						break;
					case 246:
						code_rep.push(["std","ispath2"]);
						i++;
						break;
					case 247:
						code_rep.push(["std","fexists"]);
						i++;
						break;
					case 248:
						code_rep.push(["jmp","goto",code[i+1]]);
						i+=2;
						break;
					case 249:
						code_rep.push(["jmp","true",code[i+1]]); //USED FOR DO/WHILE
						i+=2;
						break;
					case 250:
						code_rep.push(["jmp","false2",code[i+1]]); //USED FOR FOREACH
						i+=2;
						break;
					case 251:
						code_rep.push(["jmp","for_to_back",code[i+1]]);
						i+=2;
						break;
					case 252:
						code_rep.push(["pop","for_to"]);
						i++;
						break;
					case 253:
						code_rep.push(["jmp","for_to_fwd",code[++i],get_operand()]);
						//i++;
						break;
					case 254:
						code_rep.push(["pop","for_to_step"]);
						i++;
						break;
					case 255:
						code_rep.push(["jmp","for_to_step_fwd",code[++i],get_operand()]);
						//i++;
						break;

					//BREAK

					case 261:
						code_rep.push(["std","icon_oper_draw_box",get_operand()]);
						i++;
						break;
					case 262:
						i++;
						code_rep.push(["std","icon_oper_insert",code[i++],code[i++]]);
						break;
					case 263:
						code_rep.push(["std","url_encode"]);
						i++;
						break;

					case 264:
						code_rep.push(["std","url_decode"]);
						i++;
						break;

					case 265:
						code_rep.push(["std","md5"]);
						i++;
						break;
					case 266:
						code_rep.push(["std","text2path"]);
						i++;
						break;
					case 267:
						code_rep.push(["std","output"]);
						i++;
						break;
					case 268:
						code_rep.push(["std","winset"]);
						i++;
						break;
					case 269:
						code_rep.push(["std","winget"]);
						i++;
						break;
					case 270:
						code_rep.push(["std","winclone"]);
						i++;
						break;
					case 271:
						code_rep.push(["std","winshow"]);
						i++;
						break;
					case 272:
						code_rep.push(["std","icon_oper_map_colors",code[++i],code[++i]]);
						i++;
						break;
					case 273:
						code_rep.push(["std","icon_oper_scale",code[++i]]);
						i++;
						break;
					case 274:
						code_rep.push(["std","icon_oper_crop",code[++i]]);
						i++;
						break;

					//BREAK

					case 276:
						code_rep.push(["std","icon_oper_states"]);
						i++;
						break;
					case 277:
						code_rep.push(["std","icon_oper_getpixel",code[++i]]);
						i++;
						break;

					//BREAK

					case 275:
						code_rep.push(["std","rgba"]);
						i++;
						break;

					//BREAK
					case 278:
						code_rep.push(["call","getf_dll",null,code[i+1]]);
						i+=2;
						break;


					//BREAK
					case 280:
						code_rep.push(["std","winexists"]);
						i++;
						break;
					case 281:
						code_rep.push(["std","icon_oper_blend",get_operand()]);
						i++;
						break;
					case 282:
						code_rep.push(["std","icon_oper_dim"]);
						i++;
						break;

					case 289:
						code_rep.push(["std","step_towards_3"]);
						i++;
						break;


					//BREAK

					case 296:
						code_rep.push(["std","animate_listcall"]);
						i++;
						break;
					case 297:
						code_rep.push(["std","animate"]);
						i++;
						break; //also 200, maybe more, these are fuckin goofy! dont touch
					case 298:
						code_rep.push(["std","matrix",code[i+1]]);
						i+=2;
						break;

					//BREAK
					case 299:
						code_rep.push(["std","db_op",code[i+1]]);
						i+=2;
						break;


					case 300:
						code_rep.push(["ex","try",code[i+1]]);
						i+=2;
						break;
					case 301:
						code_rep.push(["ex","throw"]);
						i++;
						break;
					case 302:
						code_rep.push(["ex","catch",code[i+1]]);
						i+=2;
						break;
					case 303: //jump out of try
						code_rep.push(["jmp","goto",code[i+1]]);
						i+=2;
						break;

					//BREAK
					default:
						code_rep.push(["decode_fail",code[i],code.length]);
						i=1/0;
				}
			}

			for (var i=0;i<code_rep.length;i++) {
				var ins = code_rep[i];

				if (ins[0]=="jmp"||ins[0]=="ex") {
					ins[2]=code_ids.indexOf(ins[2]);
				} else if (ins[0]=="switch") {
					var sw = ins[1];
					if (sw.ranges) {
						sw.ranges.forEach(function(c) {
							c[2]=code_ids.indexOf(c[2]);
						});
					}
					sw.cases.forEach(function(c) {
						c[1]=code_ids.indexOf(c[1]);
					});
					sw.def = code_ids.indexOf(sw.def);
				} else if (ins[0]=="pick") {
					var sw = ins[2];
					sw.cases.forEach(function(c) {
						c[1]=code_ids.indexOf(c[1]);
					});
					sw.def = code_ids.indexOf(sw.def);
				}

				/*code_rep[i] = code_rep[i].replace(/#(\d+)/g,function(s,n) {
					return code_ids.indexOf(parseInt(n));
				});*/
			}

			/*for (var i=0;i<code_rep.length;i++) {
				console.log("\t\t"+i+": "+code_rep[i]);
			}*/

			out_func.code=code_rep;

			return out_func;
			//console.log();
			//ka = n
			//kb = 6
			//kc = n


			//console.log();
			//console.log();
			//console.log();
		}



		out_data.world.name = dump.strs[dump.world.str_name];
		out_data.world.frame_ms = dump.world.frame_ms;
		out_data.world.icon_w = dump.world.icon_w;
		out_data.world.icon_h = dump.world.icon_h;

		out_data.world.mob = dump.strs[dump.objs[dump.mobs[dump.world.a1].obj].str_path];
		out_data.world.turf = dump.strs[dump.objs[dump.world.a2].str_path];
		out_data.world.area = dump.strs[dump.objs[dump.world.a3].str_path];

		out_data.world.func_init = pipe_func(dump.world.proc_init);

		var world_procs = dump.arrays[dump.world.a4];
		if (world_procs) {
			out_data.world.methods = {};
			world_procs.forEach(function(pid) {
				var fp = dump.strs[dump.procs[pid].str_path];

				if (fp=="/world/New")
					out_data.world.func_ctor = pipe_func(pid);
				else {
					out_data.world.methods[fp] = pipe_func(pid);
					//out_data.world.methods[fp].type = "member";
				}
			});
		}

		out_data.in_lists = [];

		dump.m2.forEach(function(m) {
			//console.log(m[1]);
			//console.log(m[2]);
			/*var aa = pipe_func( m[1] );
			var bb;
			if (m[2] != 65535)
				bb = pipe_func( m[2] );*/
			var new_f = pipe_func( m );
			new_f.type = "in_list";
			out_data.in_lists.push( new_f );

			//console.log( pipe_func( m ) );

			//out_data.in_lists.push( [ m[0], aa , bb ] );
		});


		//out_data.in_lists = dump.m3;

		//throw "^^^";

		//console.log();
		//console.log("=============================================> OBJECT");
		//console.log();

		dump.objs.forEach(function(o) {
			var out_obj = {};

			out_obj.path = dump.strs[o.str_path];
			out_data.classes[out_obj.path] = out_obj;

			/*out_obj.name = dump.strs[o.str_name];
			if (o.a4 != 65535)
				out_obj.desc = dump.strs[o.a4];*/

			out_obj.vars={};
			//out_obj.vars_system={};
			out_obj.vars_inherited={};

			out_obj.methods={};
			out_obj.verbs={};

			var parent = dump.objs[o.obj_parent];

			if (parent)
				out_obj.parent = dump.strs[parent.str_path];

			out_obj.func_init = pipe_func(o.proc_init);

			var vars = dump.arrays[o.array_vars];

			if (vars) {
				//console.log("\t[VARS-1]");
				for (var i=0;i<vars.length;i+=2) {
					//if (vars[i+1]!=0)
					//	console.log("wtfpig");
						//throw "NIGHT MAN";

					var kv = dump.keyvals[vars[i]];
					
					//console.log(out_obj.path,dump.strs[kv[2]]);
					try {
						out_obj.vars[dump.strs[kv[2]]] = get_val(kv[0],kv[1]);
					} catch (wwwwww) {
						out_obj.vars[dump.strs[kv[2]]] = "UNKNOWABLE: "+wwwwww;
						break;
					}
					//console.log("\t\t"+dump.strs[kv[2]]+" = "+get_str(kv[0],kv[1]));
				}
			}

			vars = dump.arrays[o.array_vars2];

			if (vars) {
				//console.log("\t[VARS-2]");

				/*var toomany = false;

				if (vars.length>4)
					toomany=true;*/

				var i=0;
				while (i<vars.length) {
					var k = dump.strs[vars[i++]]; // NOTE THAT THIS FUNCTIONS DIFFERENTLY IN V2/V3
					var r;
					try {
						r = read_val(vars,i);
					} catch (ooooo) {
						out_obj.vars_inherited[k] = "UNKNOWABLE: "+ooooo;
						break;
					}
					var v = r[0];
					i += r[1];

					out_obj.vars_inherited[k] = v;

					//console.log("\t\t"+k+" = "+v);
				}

				//if (toomany) {
					//console.log(out_obj.path);
					//console.log(out_obj.vars_system);
					//throw "I AM BROKEN!";
				//}
			}

			vars = dump.arrays[o.array_vars3];

			if (vars) {
				//console.log("\t[VARS-3]");

				var i=0;
				while (i<vars.length) {
					var k = dump.strs[dump.keyvals[vars[i++]][2]]; // NOTE THAT THIS FUNCTIONS DIFFERENTLY IN V2/V3
					
					var r;
					try {
						r = read_val(vars,i);
					} catch (eeeeee) {
						out_obj.vars_inherited[k] = "UNKNOWABLE: "+eeeeee;
						break;
					}
					var v = r[0];
					i += r[1];

					//console.log("\t\t"+k+" = "+v);
					out_obj.vars_inherited[k] = v;
				}
			}

			var procs = dump.arrays[o.array_procs];
			if (procs) {
				//console.log("\t[PROCS]");
				var ctor_name = out_obj.path+"/New"
				procs.forEach(function(pid) {
					//console.log("\t\t"+dump.strs[dump.procs[pid].str_path]);

					var fp = dump.strs[dump.procs[pid].str_path];

					if (fp==ctor_name)
						out_obj.func_ctor = pipe_func(pid);
					else {
						out_obj.methods[fp] = pipe_func(pid);
						out_obj.methods[fp].type = "member";
					}
				});
			}

			procs = dump.arrays[o.array_verbs];
			if (procs) {
				//console.log("\t[VERBS]");
				procs.forEach(function(pid) {
					var fp = dump.strs[dump.procs[pid].str_path];

					out_obj.verbs[fp] = pipe_func(pid);
					out_obj.verbs[fp].type = "member_verb";

					//out_obj.verbs.push(dump.strs[dump.procs[pid].str_path]);
					//console.log("\t\t"+dump.strs[dump.procs[pid].str_path]);
				});
			}


			//if (out_obj.vars_inherited["icon"])

			if (o.a5 != 65535) {
				out_obj.vars_inherited["icon"] = ["rsc",o.a5];
			}
			if (o.a6 != 65535) {
				out_obj.vars_inherited["icon_state"] = dump.strs[o.a6];
			}

			/*if (o.n2!=65535) {
				console.log("==>"+dump.strs[o.n2])
			}*/

			if (o.y != 0) {
				out_obj.vars_inherited["layer"] = o.y;
			}

			out_obj.vars_inherited["dir"] = o.x1;

			/*if (o.x1 != 2) {
				console.log(out_obj.path+" > "+o.x1);
			}*/

			//console.log(">>>>",o.a5,o.a6);
			//console.log(dump.strs[o.a6]);


			//console.log("--------->",procs);

			//console.log();
		});

		dump.mobs.forEach(function(m) {

			//obj
			//i2 - doesnt fucking matter
			//i3 - doesnt fucking matter - flags
			//c1 - dark
			//c2 - invisible

			out_data.classes[ dump.strs[ dump.objs[m.obj].str_path ] ].vars_inherited["see_in_dark"] = m.c1;
			out_data.classes[ dump.strs[ dump.objs[m.obj].str_path ] ].vars_inherited["see_invisible"] = m.c2;
		});

		//console.log(JSON.stringify(out_data));
		
		/*console.log("========== TEST ============");
		console.log();

		dump.keyvals.forEach(function(kvkv,n) {
			console.log(n,dump.strs[kvkv[2]],kvkv[0]);
		});
		
		console.log();

		console.log("=============================================> PROC");
		console.log();*/





		//console.log();
		fs.readFile(index_name,function(err,json) {
			var base_index = JSON.parse(json);
			var index_map = {};
			out_data.index =  [];

			dump.rsc.forEach(function(a,i) {
				//console.log(i,base_index[a]);
				out_data.index[i] = base_index[a];
			});
			
			fs.writeFileSync(out_name,JSON.stringify(out_data,null,4));
			finish_callback(out_data);
		})

	});
}
