var fs = require("fs");

var pipe = require("./sompipe.js");

var sname = require("./somname.js");


var exec = require('child_process').exec;
/*
function foo() {
  var e = new Error('dummy');
  var stack = e.stack.replace(/^[^\(]+?[\n$]/gm, '')
      .replace(/^\s+at\s+/gm, '')
      .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
      .split('\n');
  console.log(stack);
*/

  // ...
  // rest of the code
//}

String.prototype.repeat = function( num )
{
	//console.log(num);
	if (num==null || num!=num) {
		//foo();
		//throw "repplz";
		return this+"<-REP->";
	}
	return new Array( num + 1 ).join( this );
}

//var global_names = {};
//WARNING: DUPLICATE IN SOMDECOMP!
function addslashes( str ) {
	return (str + '').replace(/[\\\n"]/g,function(c) {
		if (c=="\n")
			return "\\n";
		else return "\\"+c
	});
}

/*function expand(n,prec) {
	if (n==null)
		return "null";
	else if (typeof(n)=="string")
		return '"'+addslashes(n)+'"';

	return n.toString();
}*/

//console.log(process.argv);

var fail_stats = {};

var dir = process.argv[2];
var bin_name = process.argv[3];

function do_post_dump() {
	console.time("Pipe");

	pipe("workspace/int-"+dir+"/"+bin_name+".somdump","workspace/int-"+dir+"/"+bin_name+".somdex","workspace/int-"+dir+"/"+bin_name+".sompipe",function(pipe_data) {
		console.timeEnd("Pipe");
		
		sname.set_index(pipe_data.index);

		var dc = require("./somdecomp.js")
		
		var __ = dc.new_decompiler(pipe_data,sname.name_index,sname.vnames,sname);

		var decompile = __.decompile;
		var expand = __.expand;
		var expand_list = __.expand_list;
		var unfuck_ctor = __.unfuck_ctor;

		console.time("Name");
		sname.globals(pipe_data);
		sname.members(pipe_data);
		

		//var f = pipe_data.classes["/mob"].verbs["/mob/verb/dingus"];

		var count_funcs = 0;
		var count_funcs_good = 0;

		function decomp_func(f) {
			if (f.dc!=null) {
				return;
			}
			count_funcs++;
			try {
				f.dc = decompile(f);
				count_funcs_good++;
			} catch (n) {
				if (n.stack==null)
					f.err=n;
				else
					f.err = n.stack;
				//if (f.path=="/datum/action/Destroy")
			//		throw n;
				console.log("]]",f.path,n);
				throw n;
			}
		}

		function write_full_func(f,tabs,insert_txt) {

			// what about CTORS?

			// UGH

			if (f.dc==null) {
				//txt+="\n//FAILURE\n";
				return "\n/*FAILURE "+f.varData.name+" "+f.err+" */\n";
			}


			var txt = "";

			if (f.file)
				txt += "\t".repeat(tabs)+"// Function from file: "+f.file+"\n"
			//txt+="\t".repeat(tabs)+"// "+f.flags_1+" "+f.flags_2+" "+f.flags_3

			var is_verb = false;

			if (f.verb_hint) {
				is_verb = true;
				txt += "\t".repeat(tabs)+"// Warning, this is probably a verb! It is in a place that a verb probably shouldn't be! This should probably be fixed!\n";
			}

			var calculated_verb_name = null;
			if (f.varData.name!=null) {
				calculated_verb_name= f.varData.name.replace(/_/g," ");
			}

			if (f.verb_name!=null && f.verb_name != calculated_verb_name && f.verb_name != "New") {
				is_verb = true;
			}

			if (f.verb_decl || f.verb_desc!=null || f.verb_cat!=null || f.verb_access || f.verb_range != null) {
				is_verb = true;
			}

			if (f.verb_decl) {
				txt += "\t".repeat(tabs)+"[Verb]\n";
			}

			var is_hidden = false;

			if (f.flags_1 && f.flags_1 & 1) {
				is_hidden = true;

				/*if (them_flags & 128) {
					// BG
					them_flags += 128;
				}
				if (them_flags)
					txt += "\t".repeat(tabs)+"// #F1 "+them_flags+"\n";*/
			}

			/*if (f.flags_2 && f.flags_2 != 4)
				txt += "\t".repeat(tabs)+"// #F2 "+f.flags_2+"\n";
			
			if (f.flags_3 && f.flags_3 != 255)
				txt += "\t".repeat(tabs)+"// #F3 "+f.flags_3+"\n";*/

			if (is_verb) {
				txt += "\t".repeat(tabs)+"[VerbInfo( "

				var comma_me = false;

				if (f.verb_name!=null && f.verb_name != calculated_verb_name && f.verb_name != "New") {
					comma_me = true;
					txt+= "name: \""+addslashes(f.verb_name)+"\"";
				}

				if (f.verb_desc!=null) {
					if (comma_me)
						txt+=", ";
					else
						comma_me=true;
					txt+= "desc: \""+addslashes(f.verb_desc)+"\"";
				}

				if (f.verb_cat!=null) {
					if (comma_me)
						txt+=", ";
					else
						comma_me=true;
					txt+= "group: \""+ addslashes(f.verb_cat)+"\"";
				}

				if (f.verb_access) {
					if (comma_me)
						txt+=", ";
					else
						comma_me=true;
					txt+= "access: VerbAccess.";
					switch (f.verb_access) {
						case 1:
							txt+= "InView";
							break;
						case 2:
							txt+= "InViewExcludeThis";
							break;
						case 3:
							txt+= "InUserLocation";
							break;
						case 5:
							txt+= "InRange";
							break;
						case 8:
							txt+= "InUserContents";
							break;
						case 32:
							txt+= "IsUser";
							break;
						default:
							txt+="INVALID_"+f.verb_access;
					}
				}

				if (f.verb_range!=null) {
					if (comma_me)
						txt+=", ";
					else
						comma_me=true;
					txt+= "range: "+ f.verb_range;
				}

				if (is_hidden) {
					if (comma_me)
						txt+=", ";
					else
						comma_me=true;
					txt+= "hidden: true";
				}

				txt += " )]"+"\n";

				if (f.arg_info!=null) {
					f.arg_info.forEach(function(a,i) {
						if (a[0] || a[1] != 32001) {

							txt += "\t".repeat(tabs)+"[VerbArg( "+(i+1)+", ";

							txt += expand(["input_type",a[0]]);

							if (a[1] != 32001 && a[1] != 32528) {
								txt += ", ";

								if (a[1]>32000) {
									if (a[1]==32002) {
										txt+="VerbArgFilter.InViewExcludeThis";
									} else {
										throw "~~~~~~~~~~";
									}
								} else {
									if (pipe_data.in_lists[ a[1]>>8 ].dc.length != 1) {
										throw "BAD BAD BAD BAD BAD BAD! "+pipe_data.in_lists[ a[1]>>8 ].dc.length;
									}
									var nn = pipe_data.in_lists[ a[1]>>8 ].dc[0];
									if (nn.constructor.name != "NodeReturn")
										throw "BADDER "+nn.constructor.name;

									if (nn.value.constructor.name=="NodeGlobalVar") {
										txt+= "VerbArgFilter.FromGlobalVar, " + expand(nn.value._var.name);
									} else if (nn.value.constructor.name=="NodeList") {
										txt+= "VerbArgFilter.TheseValues";
										nn.value.data.forEach(function(nnn) {
											txt+=", "+expand(nnn);
										});
									} else if (nn.value.constructor.name=="NodeCall") {
										if (nn.value.func.constructor.name=="NodeGlobalFunc") {
											txt+= "VerbArgFilter.FromGlobalFunc, " + expand(nn.value.func.f.varData.name);
										} else if (nn.value.func.constructor.name=="NodeIndex" && nn.value.func.base.constructor.name=="NodeThis") {
											txt+= "VerbArgFilter.FromMemberFunc, " + expand( nn.value.func.key.substring(1).replace(/ /,"_") );
										} else {
											throw "98908098 "+nn.value.func.constructor.name;
										}

										nn.value.args.forEach(function(nnn) {
											txt+=", "+expand(nnn);
										});

									} else if (nn.value.constructor.name=="NodeIndex") {
										if (nn.value.base.constructor.name=="NodeThis") {
											txt+= "VerbArgFilter.FromMemberVar, " + expand(nn.value.key);
										} else if (nn.value.base.constructor.name=="NodeGlobalVar") {
											txt+= "VerbArgFilter.FromGlobalVarMemberVar, " + expand(nn.value.base._var.name) + ", " + expand(nn.value.key);
										} else {
											console.log(nn.value.base.constructor.name);
											throw "8888888";
										}
									} else {
										throw "ZZZZZ "+nn.value.constructor.name;
									}
								}

								//+a[1];
							}

							if (a[2]>0) {
								txt += "--THE FUCK IS THIS--";
							}
							
							var cc = pipe_data.in_lists[a[1]];
							/*if (cc!=null)
								cc = cc[2];
							if (cc!=null)
								cc = cc.dc;*/

							

							/*if (a[1]>=32000)
								console.log("====>",a[1]);
							else {
								console.log(a[1].toString(2), (a[1]>>8).toString(2), a[1]>>8 );
							}*/
							txt += " )]\n";
						}
						
					});
				}
			}

			txt += "\t".repeat(tabs)+f.varData.def(null,null,null,f.etc)+"( "

			f.args.forEach(function(z,i) {
				if (i!=0)
					txt+=", ";
				txt+= z.def(expand,null,null,null,true);
			});
			
			if (f.uses_arglist) {
				if (f.args.length!=0)
					txt+=", ";
				txt+="params object[] _";
			}

			if (f.ctor_init)
				txt+=" ) : "+expand(f.ctor_init)+" {"
			else
				txt+=" ) {";

			txt+="\n";
			
			//try {
				//f.dc = decompile(f,tabs+1); //decompile first so decompile-time checks can take place (defret (should it go somewhere else?))!
				

				if (f.uses_arglist) {
					txt+="\t".repeat(tabs+1)+"ByTable _args = new ByTable( new object[] { ";

					f.args.forEach(function(z,i) {
						if (i!=0)
							txt+=", ";
						txt+= z.name;
					});

					txt+=" } ).Extend(_);\n\n"; // just construct it if args is empty
				}
				
				var added_default_mods = false;

				while(true) {
					var n = f.dc[0];
					//console.log(n);
					if (n != null && n.constructor.name=="NodeIfElse" && n.cond.constructor.name=="NodeBinary" && n.cond.left.constructor.name=="NodeLocalVar" && n.cond.op=="==" && n.cond.right==null) {
						var n2 = n.list_true[0];
						if (n2 != null && n2.constructor.name=="NodeBinary" && n2.left.constructor.name=="NodeLocalVar" && n.cond.left._var == n2.left._var && n2.op=="=") {
							if (n2.right != null) {
								txt+="\t".repeat(tabs+1) + (n2.left._var.name+" = "+n2.left._var.name+" ?? "+expand(n2.right,null,null,n2.left._var.type) ) + ";\n";
								added_default_mods=true;
							}
							
							f.dc.shift();
							continue;
						}
					}
					break;
				}

				if (added_default_mods)
					txt+="\n";
				
				if (f.uses_defret) {
					txt+="\t".repeat(tabs+1)+f.varData.def(expand,null,true)+";\n\n";
				}

				if (f.vars.length>0) {

					f.vars.forEach(function(z,i) {
						txt+="\t".repeat(tabs+1)+z.def(expand,tabs+1)+";\n"
					});
					txt+="\n";
				}


				//try {
				//if (insert_txt!=null)
				//	txt+=insert_txt;	

				txt+=expand_list(f.dc,tabs+1);
				//} catch(n) {
				//	console.log(">>",txt);
					//throw n;
				//}

				//if (f.uses_defret)
				//	txt+="\n"+"\t".repeat(tabs+1)+"return _default;";
			//} 
			/*catch (e) {
				throw e;
				/*if (fail_stats[ins[1]]==null)
					fail_stats[ins[1]]=1;
				else
					fail_stats[ins[1]]++;

				var the_last = f.code[f.code.length-1];

				if (the_last[0]=="decode_fail") {
					if (fail_stats[the_last[1]]==null)
						fail_stats[the_last[1]]=1;
					else
						fail_stats[the_last[1]]++;
				}

				//console.log(">",the_last);


				txt+="\t".repeat(tabs+1)+"// "+e+"\n";
				txt+="\t".repeat(tabs+1)+"// "+f.path+"\n";
				txt+="\t".repeat(tabs+1)+("/*"+ JSON.stringify(f.code.slice(Math.max(f.code.length - 10, 1)),null,"\t") + "*").replace(/\n/g,"\n"+"\t".repeat(tabs+1));
			}*/
			txt+="\n"+"\t".repeat(tabs)+"}\n";
			return txt
		}

		/*function decompile_classes(l) {
			var txt="";

			l.forEach(function(cn) {
				txt+=decompile_full_class(pipe_data.classes[cn]);
			});

			return txt;
		}*/

		function write_full_class(c) {
			if (c.name=="Exception") // Don't write this out!
				return "";
			//console.log(c.name);
			var txt;
			if (c.partial)
				txt="\tpartial class "+c.name+" ";
			else
				txt="\tclass "+c.name+" ";
			if (c.parent)
				txt+=": "+c.parent.name+" ";
			txt+="{\n\n";

			/*for (var k in c.vars_system) {
				txt+="\t\tpublic dynamic "+k+" = "+expand(c.vars_system[k])+";\n";
			}
			if (Object.keys(c.vars_system).length>0)
				txt+="\n";*/
			
			for (var k in c.vars) {
				//txt+="\t\t"+k+" = "+expand(c.vars[k])+"\n";
				if (c.vars[k].fake) continue
				txt+="\t\t"+c.vars[k].def(expand,10)+";\n";
			}
			if (Object.keys(c.vars).length>0)
				txt+="\n";
			
			
			var overrides_txt = "";

			function vars_equal(a,b) {
				if (a instanceof Array && b instanceof Array && a[0]=="rsc" && b[0]=="rsc" && a[1]==b[1]) {
					return true;
				}
				return a==b;
			}

			xerxes:
			for (var k in c.vars_inherited) {
				var nn = k;
				var tt = "BROKEN_INHERIT";
				var cc = c.parent;
				while (cc!=null) {
					if (cc.vars[k]) {
						if ( vars_equal(c.vars_inherited[k],cc.vars[k].value ))
							continue xerxes;

						nn = cc.vars[k].name;
						tt = (cc.vars[k].type||"dynamic");
						cc = null;
					}

					if (cc!=null && vars_equal(c.vars_inherited[k], cc.vars_inherited[k]))
						continue xerxes;
					
					/*for (var kk in cc.vars) {
						if (cc.vars[kk].name == k) {
							tt = (cc.vars[kk].type||"dynamic");
							cc = null;
							break;
						}
					}*/
					if (cc!=null)
						cc = cc.parent;
				}

				overrides_txt+="\t\t\tthis."+nn+" = "+expand(c.vars_inherited[k],3,null,tt)+";\n";
			}
			
			/*if (overrides_txt.length>0) {
				txt+="\t\t\t//Variable Overrides\n";
				txt+=overrides_txt;
			}*/

			if (overrides_txt.length>0) {
				txt+="\t\tprotected override void __FieldInit() {\n";
				txt+="\t\t\tbase.__FieldInit();\n\n";
				txt+=overrides_txt;
				txt+="\t\t}\n\n";
			}

			if (c.func_ctor) {
				/*if (overrides_txt.length>0) {
					overrides_txt = "\t\t\t// Variable Overrides\n"+overrides_txt+"\n";
				} else {
					overrides_txt = null;
				}*/
				txt+=write_full_func(c.func_ctor,2);
				txt+="\n";
			}/* else if (overrides_txt.length>0) {
				txt+="\t\tpublic "+c.name+"() { //NOCTOR\n";
				txt+="\t\t\t// Variable Overrides\n";
				txt+=overrides_txt;
				txt+="\t\t}\n\n";
			}*/

			for (var k in c.methods) {
				txt+=write_full_func(c.methods[k],2)+"\n";
			}

			for (var k in c.verbs) {
				txt+=write_full_func(c.verbs[k],2)+"\n";
			}

			txt+="\t}\n\n";

			//txt+=decompile_classes(c.children);

			return txt;
		}


		if (pipe_data.world.icon_w!=pipe_data.world.icon_h)
			throw "FUCK THIS SHIT!";
		

		// Name world shit.

		function name_world_func(func,path) {
			func.is_world_func = true;
			func.varData = new sname.NodeVar(path.split("/").pop());
			func.varData._static = true;
			func.varData.type = "void";

			//sname.locals(func);
		}

		name_world_func(pipe_data.world.func_ctor,"New");

		for (var k in pipe_data.world.methods) {
			name_world_func(pipe_data.world.methods[k],k);
		}

		// EDEN



		function apply_to_funcs(f_to_apply) {
			// Initial decompile of global init func
			f_to_apply(pipe_data.world.func_init);
			
			// Initial decompile of world shit
			f_to_apply(pipe_data.world.func_ctor);
			for (var k in pipe_data.world.methods) {
				f_to_apply(pipe_data.world.methods[k]);
			}

			// Initial decompile of globals
			for (var gfk in pipe_data.global_funcs) {
				f_to_apply(pipe_data.global_funcs[gfk]);
			}

			for (var gik in pipe_data.initializers) {
				f_to_apply(pipe_data.initializers[gik]);
			}

			for (var glk in pipe_data.in_lists) {
				f_to_apply(pipe_data.in_lists[glk]);
			}

			// Initial decompile of classes
			for (var gck in pipe_data.classes) {
				var c = pipe_data.classes[gck];

				if (c.func_ctor) {
					f_to_apply(c.func_ctor);
				}
				if (c.func_init) {
					f_to_apply(c.func_init);
				}

				for (var k in c.methods) {
					f_to_apply(c.methods[k]);
				}

				for (var k in c.verbs) {
					f_to_apply(c.verbs[k]);
				}
			}
		}

		apply_to_funcs(sname.locals);

		
		console.timeEnd("Name");


		console.time("Decompile");


		apply_to_funcs(decomp_func);

		// Fix ctors
		//unfuck_ctor(c);

		pipe_data.root_classes.forEach(function(rc) {
			unfuck_ctor(rc);
		});

		for (var k in pipe_data.world.methods) {
			//console.log(">"+pipe_data.world.methods[k].name,pipe_data.world.methods[k].verb_name);
			pipe_data.map_libs["Game13"]["$"+pipe_data.world.methods[k].verb_name] = pipe_data.world.methods[k];
		}

		// Fix v methods
		/*function glue_virtual(f) {
			if (f.v_master!=null && false) {
				for (var i=0;i<f.v_master.args.length;i++) {
					if (f.args[i]==null) {
						f.args[i] = f.v_master.args[i].clone();
					}
					f.args[i].slave(f.v_master.args[i]);
				}
			}
		}

		for (var gck in pipe_data.classes) {
			var c = pipe_data.classes[gck];

			for (var k in c.methods) {
				glue_virtual(c.methods[k]);
			}

			for (var k in c.verbs) {
				glue_virtual(c.verbs[k]);
			}
		}*/


		console.timeEnd("Decompile");
		

		var ordered_globals = [];


		function process_init_func(f) {
			if (f.args.length != 0 || f.vars.length != 0)
				throw "Bad init func!";

			f.dc.forEach(function(n) {
				if (n.constructor.name=="NodeReturn")
					return; //skip the fucking thing

				if (n.constructor.name=="NodeBinary" && n.op=="=") {
					if (n.left.constructor.name == "NodeGlobalVar") {
						n.left._var.exclude_write = true;
						ordered_globals.push(n.left._var);
						n.left._var.setInitial(n.right);
					} else if (n.left.constructor.name == "NodeIndex") {
						if (n.left.base.constructor.name == "NodeThis") {
							var i_class = pipe_data.map_classes[n.left.base.class];

							if (i_class.vars[n.left.key] != null) {
								i_class.vars[n.left.key].setInitial(n.right);
							} else {
								//console.log("i",i_class.name,n.left.key)
								i_class.vars_inherited[n.left.key] = n.right;
								var cc = null;
								cc = i_class;
								while (cc != null) {
									if (cc.vars[n.left.key] != null) {
										cc.vars[n.left.key].suggest(n.right);
										break;
									}
									cc = cc.parent;
								}
							}
							/*
							var ff = n.left.get_f();
							if (ff==null) {
								console.log("danger money");
								return;
							}
							ff.varData.setInitial(n.right);*/
						} else {
							throw "bad init 3 "+n.left.base.constructor.name;
						}		
					} else {
						throw "bad init 2 "+n.left.constructor.name;
					}
				} else {
					throw "bad init 1 "+n.constructor.name+" "+n.op;
				}
			});
		}

		var TYPE_PASS_N = 10

		console.time("Type Inference ("+TYPE_PASS_N+" PASSES)");
		
		// Do type computation
		for (var ti = 0; ti<10; ti++) {
			process_init_func(pipe_data.world.func_init);
			sname.compute_types(pipe_data.world.func_ctor.dc);

			for (var k in pipe_data.world.methods) {
				sname.compute_types(pipe_data.world.methods[k].dc);
			}

			for (var gfk in pipe_data.global_funcs) {
				sname.compute_types(pipe_data.global_funcs[gfk].dc);
			}

			for (var gck in pipe_data.classes) {
				var c = pipe_data.classes[gck];
				if (c.func_init) {
					process_init_func(c.func_init);
				}

				if (c.func_ctor) {
					if (c.func_ctor.ctor_init)
						sname.get_type(c.func_ctor.ctor_init);
					sname.compute_types(c.func_ctor.dc);
				}

				for (var k in c.methods) {
					sname.compute_types(c.methods[k].dc);
				}

				for (var k in c.verbs) {
					sname.compute_types(c.verbs[k].dc);
				}
			}
		}

		console.timeEnd("Type Inference ("+TYPE_PASS_N+" PASSES)");

		sname.set_global_lock(true);

		console.time("Construct");

		var HEADER_MAIN = "// FILE AUTOGENERATED BY SOMNIUM13.\n\nusing System;\nusing Somnium.Engine.ByImpl;\n\n";

		var HEADER_GAME = "// FILE AUTOGENERATED BY SOMNIUM13.\n\nusing System;\nusing Somnium.Game;\n\n// THIS EXTENDS THE ENGINE'S GAME CLASS!\n\n";

		

		// END EDEN

		
		var src_game = HEADER_GAME+"namespace Somnium.Engine.ByImpl {\n\tstatic partial class Game13 {\n"

		//src_game += "\t\tpublic static void _init_(this Game13 )"

		src_game += "\t\tpublic static string name = \""+pipe_data.world.name+"\";\n";
		src_game += "\t\tprivate static double _tick_lag = "+pipe_data.world.frame_ms/100+";\n";
		src_game += "\t\tpublic const int icon_size = "+pipe_data.world.icon_w+";\n";

		src_game += "\n";

		src_game += "\t\tpublic static readonly Type default_mob = typeof("+ pipe_data.classes[pipe_data.world.mob].name+");\n";
		src_game += "\t\tpublic static readonly Type default_tile = typeof("+ pipe_data.classes[pipe_data.world.turf].name+");\n";
		src_game += "\t\tpublic static readonly Type default_zone = typeof("+ pipe_data.classes[pipe_data.world.area].name+");\n";

		src_game += "\n\n";

		src_game += write_full_func(pipe_data.world.func_ctor,2)+"\n";

		for (var k in pipe_data.world.methods) {
			src_game += write_full_func(pipe_data.world.methods[k],2)+"\n";
		}

		src_game += "\t}\n}";

		fs.writeFileSync("workspace/som-"+dir+"/Game/Game13Ext.cs",src_game);




		var sorted_vars = [];
		for (var gvk in pipe_data.global_vars) {
			sorted_vars.push(pipe_data.global_vars[gvk]);
		}
		sorted_vars.sort(function(a,b) {
			return a.name.localeCompare(b.name);
		});

		var src_vars = HEADER_MAIN+"namespace Somnium.Game {\n\tstatic class GlobalVars {\n";
		
		src_vars+="\n\t\t// Constants:\n\n";

		sorted_vars.forEach(function(gv) {
			if (!gv.exclude_write && gv._const)
				src_vars+="\t\t"+gv.def(expand,2)+";\n";
		});

		src_vars+="\n\t\t// Normal variables:\n\n";

		sorted_vars.forEach(function(gv) {
			if (!gv.exclude_write && !gv._const)
				src_vars+="\t\t"+gv.def(expand,2)+";\n";
		});

		src_vars+="\n\t\t// Variables with initializer code:\n\n";

		var global_vars_collision = {};
		ordered_globals.forEach(function(gv) {
			if (global_vars_collision[gv.name])
				return;
			src_vars+="\t\t"+gv.def(expand,2)+";\n";
			global_vars_collision[gv.name] = true;
		});
		
		fs.writeFileSync("workspace/som-"+dir+"/Game/GlobalVars.cs",src_vars+"\t}\n}");




		var sorted_funcs = [];
		for (var gfk in pipe_data.global_funcs) {
			sorted_funcs.push(pipe_data.global_funcs[gfk]);
		}
		sorted_funcs.sort(function(a,b) {
			var xx = a.file.localeCompare(b.file);
			if (xx!=0)
				return xx;

			return a.varData.name.localeCompare(b.varData.name);
		});

		var src_funcs = HEADER_MAIN+"namespace Somnium.Game {\n\tstatic class GlobalFuncs {\n";

		sorted_funcs.forEach(function(gf) {
			src_funcs += write_full_func(gf,2)+"\n";
		});
		fs.writeFileSync("workspace/som-"+dir+"/Game/GlobalFuncs.cs",src_funcs+"\t}\n}");

		


		/*var sorted_classes = [];
		for (var gck in pipe_data.classes) {
			sorted_classes.push(pipe_data.classes[gck]);
		}
		sorted_classes.sort(function(a,b) {
			return a.name.localeCompare(b.name);
		});*/


		for (var gck in pipe_data.classes) {
			var c = pipe_data.classes[gck];
			
			if (!c.engine_side) {

				var src_class = HEADER_MAIN+"namespace Somnium.Game {\n";
				src_class += write_full_class(c);

				fs.writeFileSync("workspace/som-"+dir+"/Game/Classes/"+c.name+".cs",src_class+"}");
			}
		}

		/*var src_classes = HEADER_MAIN+"namespace Somnium.Game {\n";
		sorted_classes.forEach(function(c) {
			if (!c.engine_side)
				src_classes += write_full_class(c);

		});*/

		/*
		var src_classes2 = "using System;\nusing Game13;\n\nnamespace Som13 {\n";
		sorted_classes.forEach(function(c) {
			if (c.partial)
				src_classes2 += write_full_class(c);
		});
		fs.writeFileSync("workspace/som-"+dir+"/SomExt.cs",src_classes2+"}");

/*

		var dc_init = decompile(pipe_data.world.func_init);
		dc_init.forEach(function(n) {
			if (n.constructor.name!="NodeBinary" || n.op!="=" || n.left.constructor.name != "NodeGlobalVar") {
				throw "bad init";
			}

			pipe_data.global_vars[n.left.name].setInitial(n.right);
		});*/
			//console.log(n.left.name,"//",n.right);
		//fs.writeFileSync("workspace/som-"+dir+"/g_init.cs",src_init);



		//var teh_codez = get_init_code();

		//teh_codez += "\n// global functions\n\n";

		//for (var gfk in pipe_data.global_funcs) {
		//	teh_codez += write_full_func(pipe_data.global_funcs[gfk],0)+"\n";
		//} 

		//teh_codez+= pipe_data.root_classes;

		//for (gck in pipe_data.global_)

		//teh_codez += write_full_func( pipe_data.classes["/mob"].verbs["/mob/verb/dingus"] ,0);

		//teh_codez += write_full_func( pipe_data.classes["/mob"].verbs["/mob/verb/filth"] ,0);		

		//RE-ACTIVATE THIS SOON!

		////var src_class = decompile_classes(pipe_data.root_classes);
		////fs.writeFileSync("workspace/som-"+dir+"/g_class.cs",src_class);

		console.timeEnd("Construct");

		console.log("Done!");

		console.log();
		console.log(count_funcs_good+" / "+count_funcs+" -- "+ count_funcs_good/count_funcs*100 );
		console.log(fail_stats);
		console.log(dc.goto_stats());

		//console.log(write_full_func( pipe_data.classes["/mob"].verbs["/mob/verb/dingus"] ,0));
		//console.log(write_full_func( pipe_data.classes["/mob"].verbs["/mob/verb/filth"] ,0));
	});
}


function do_rsc() {
	if (fs.existsSync("workspace/int-"+dir+"/"+bin_name+".somdex")) {
		console.log("RscDump: CACHED!");
		do_post_dump();
	} else {
		console.time("RscDump");
		//console.log("rscdump workspace/"+dir+"/"+bin_name+".rsc workspace/int-"+dir+"/"+bin_name+".somdex");
		exec("rscdump workspace/"+dir+"/"+bin_name+".rsc workspace/int-"+dir+"/"+bin_name+".somdex",function(err,stdout,stderr) {

			if (err) {
				console.log("RscDump failed>",err.code,stdout);
				throw "eat shit and die"
			}

			console.timeEnd("RscDump");

			do_post_dump();
		});
	}
}


if (fs.existsSync("workspace/int-"+dir+"/"+bin_name+".somdump")) {
	console.log("BinDump: CACHED!");
	do_rsc();
} else {
	console.time("BinDump");
	//console.log("./somdump workspace/"+dir+"/"+bin_name+".dmb workspace/int-"+dir+"/"+bin_name+".somdump workspace/int-"+dir+"/"+bin_name+".sommap");
	exec("somdump workspace/"+dir+"/"+bin_name+".dmb workspace/int-"+dir+"/"+bin_name+".somdump workspace/int-"+dir+"/"+bin_name+".sommap",function(err,stdout,stderr) {

		if (err) {
			console.log("BinDump failed>",err.code,stdout);
			throw "eat shit and die"
		}

		console.timeEnd("BinDump");

		do_rsc();
	});
}