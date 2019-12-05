var fail_stats = {};
var goto_stats = 0;

function new_decompiler(pipe_data,name_index,vnames,name_lib) {

	function addslashes( str ) {
		return (str + '').replace(/[\\\n"]/g,function(c) {
			if (c=="\n")
				return "\\n";
			else return "\\"+c
		});
	}

	/*function expand_bool(n,tabs,prec,invert) {
		var t = name_lib.get_type(n);
		var s;
		var cmp = invert?" == ":" != "

		var woop = tabs;

		if (n==1)
			return "true";
		else if (n==0 || n==null)
			return "false";
		else if (t == "bool") {
			if (invert) {
				return "!"+expand_node(n,tabs,0);
			}
			return expand_node(n,tabs,prec);
		} else if (t == "string" || t == "dynamic" || t==null) {
			if (invert) {
				return "!Lang13.isValid( "+expand_node(n,tabs)+" )";
			}
			return "Lang13.isValid( "+expand_node(n,tabs,0)+" )";
		} else if (t == "double" || t == "int") {
			s = expand_node(n,tabs,5)+cmp+"0";
		} else {
			s = expand_node(n,tabs,5)+cmp+"null";
		}
		if (prec!=null) {
			return "( "+s+" )";
		}
		return s;
	}*/

	function devoid(f) {
		if (f instanceof NodeCall)
			f = f.func;
		else
			return;

		//while (f instanceof NodeCall)
		//	f = f.func;

		if (f instanceof NodeGlobalFunc) {
			if (f.f.varData.type == "void")
				f.f.varData.type = null;
		} else if (f instanceof NodeIndex) {
			var ff = f.get_f();
			if (ff!=null && ff.varData.type=="void")
				ff.varData.type = null;
		} /*else {
			throw "CANT DEVOID> "+f.constructor.name;
		}*/
	}



	function expand_node(n,tabs,prec,force_type) {
		//if (!n)
		//	return "[ERROR]"
		if (force_type===true) {
			throw new Error("EXPAND NODE BEING USED OLDLY");
		}
		var t = name_lib.get_type(n);

		if (prec==null)
			prec = 100;

		if (force_type=="bool" || force_type=="bool?") {
			if (n===1)
				return "true";
			else if (n===0)
				return "false";
		}

		if ( (force_type=="int" || force_type=="double") && (n===0 || n===1) )
			return ""+n;
		if ( force_type=="int" || force_type=="int?" ) {
			if (n==9.999999848243207e+30) {
				return "Int32.MaxValue";
			} else if (n==-9.999999848243207e+30) {
				return "Int32.MinValue";
			}
		}

		if (force_type=="bool" && n==null)
			return "false";
		if ( (force_type=="int" || force_type=="double") && n==null)
			return "0";
		if ( (force_type=="bool?" || force_type=="int?" || force_type=="double?") && n==null)
			return "null";

		if (t!=force_type) {
			if (force_type=="!bool") {
				return "!"+expand_node(n,tabs,0,"bool");
			}
			else if (force_type=="bool") {
				var cmp;
				if (t == "bool?") {
					cmp=" == true";
				}
				else if (t== "int" || t=="double") {
					cmp=" != 0";
				}
				else if (t == "string" || t=="dynamic" || t=="int?" || t=="double?" || t==null)
					return "Lang13.Bool( "+expand_node(n,tabs)+" )";
				else {
					cmp=" != null";
				}

				if (prec<5)
					return "( "+expand_node(n,tabs,5)+cmp+" )";
				return expand_node(n,tabs,5)+cmp;
			}
			else if (force_type=="bool?") {
				if (t=="bool" || t=="int" || t=="double")
					return expand_node(n,tabs,prec,"bool");
				else
					return "Lang13.BoolNullable( "+expand_node(n,tabs)+" )";
			}
			else if (force_type=="int") {
				if (t=="bool" || t=="bool?") {
					if (prec<12)
						return "( "+expand_node(n,tabs,12,"bool") + " ?1:0)" ;
					return expand_node(n,tabs,12,"bool") + " ?1:0" ;
				}
				else if (t=="int?") {
					if (prec<11)
						return "( "+expand_node(n,tabs) + " ??0)"
					return expand_node(n,tabs) + " ??0"
				}
				else if (t=="double" || t=="double?") {
					return "((int)( "+expand_node(n,tabs,null,"double")+" ))";
				}
				else if (t=="dynamic" || t==null) {
					return "Convert.ToInt32( "+expand_node(n,tabs)+" )";
				}
				else {
					return "/*[I CANNOT CONVERT SOME RANDOM SHIT TO AN INT: "+t+"]*/ 0";
				}
			}
			else if (force_type=="int?") {
				if (t=="bool" || t=="int" || t=="double")
					return expand_node(n,tabs,prec,"int");
				else if (t=="bool?" || t=="dynamic" || t==null)
					return "Lang13.IntNullable( "+expand_node(n,tabs)+" )";
				else if (t=="double?")
					return "((int?)( "+expand_node(n,tabs)+" ))";
				else
					return "/*[I CANNOT CONVERT SOME RANDOM SHIT TO AN INT?: "+t+"]*/ null";
			}
			else if (force_type=="double") {
				if (t=="bool" || t=="bool?") {
					if (prec<12)
						return "( "+expand_node(n,tabs,12,"bool") + " ?1:0)" ;
					return expand_node(n,tabs,12,"bool") + " ?1:0" ;
				}
				else if (t=="int")
					return expand_node(n,tabs,prec);
				else if (t=="int?" || t=="double?") {
					if (prec<11)
						return "( "+expand_node(n,tabs) + " ??0)"
					return expand_node(n,tabs) + " ??0"
				}
				else if (t=="dynamic" || t==null) {
					return "Convert.ToDouble( "+expand_node(n,tabs)+" )";
				}
				else {
					return "/*[I CANNOT CONVERT SOME RANDOM SHIT TO A DOUBLE: "+t+"]*/ 0";
				}
			}
			else if (force_type=="double?") {
				if (t=="bool" || t=="int" || t=="double")
					return expand_node(n,tabs,prec,"double");
				else if (t=="int?")
					return expand_node(n,tabs,prec);
				else if (t=="bool?" || t=="dynamic" || t==null)
					return "Lang13.DoubleNullable( "+expand_node(n,tabs)+" )";
				else
					return "/*[I CANNOT CONVERT SOME RANDOM SHIT TO A DOUBLE?: "+t+"]*/ null";
			}
		}

		/////////////////////

		var result = null;

		if (n==null) {
			result = "null";
		} else if (n.expand) {
			result = n.expand(tabs,prec);
		} else if (typeof(n)=="string") {
			if ((n.match(/\n/g) || []).length > 3)
				result = '@"'+n.replace(/"/g,'""')+'"';
			else
				result = '"'+addslashes(n)+'"';

		} else if (n instanceof Array) {
			if (n[0]=="class") {
				if (n[1][0]=="/")
					result = "typeof("+pipe_data.classes[n[1]].name+")";
				else
					result = "typeof("+n[1]+")";
			} else if (n[0]=="proc") {
				//console.log("["+n[1]+"]");
				//console.log(n[1].match(/^(.*)(\/proc\/.*)$/));

				//throw "--`~"
				var fff = pipe_data.global_funcs[n[1]];
				if (!fff) { // must be a method!
					if (n[1].substr(1,4)=="proc") {
						throw "broken global func!";
					}

					var path_split = n[1].split(/\/(proc|verb)\//);

					var that_class = pipe_data.classes[path_split[0]];
					if (that_class==null)
						throw "WAT: "+n[1];
					var that_func = that_class.methods[n[1]] || that_class.verbs[n[1]];

					//console.log("=>",n[1]);
					result = "typeof("+that_class.name+").GetMethod( \""+that_func.varData.name+"\" )"; //that_func.varData.name

					//console.log(n[1],n[1].substr(1,4));
					//result = "::GoofyFunc";
				} else
					result = "typeof(GlobalFuncs).GetMethod( \""+fff.varData.name+"\" )"; //that_func.varData.name
			} else if (n[0]=="rsc") {
				var rsc_path = pipe_data.index[n[1]];
				var rsc_ext = rsc_path.split(".").pop();
				/*if (rsc_ext=="dmi") {
					result = "new Icon(\""+rsc_path+"\")";
				}*/

				result = "\""+rsc_path+"\"";
			} else if (n[0]=="list_ctor") {
				result = "typeof(ByTable)";
			//} else if (n[0]=="area") {
			//	result = "new ByArea("+n[1]+")";
			} else if (n[0]=="raw") {
				result = n[1];
			} else if (n[0]=="raw_type") {
				result = null;
			} else if (n[0]=="client") {
				result = "typeof(Client)";
			} else if (n[0]=="initializer") {

				result = "new ObjectInitializer(typeof("+pipe_data.classes[n[1]].name+"))";

				pipe_data.initializers[n[2]].dc.forEach(function(nn) {
					if (nn instanceof NodeBinary && nn.op=="=") {
						result+=".Set( \""+nn.left.key+"\", " + expand_node(nn.right) + " )";
					}
				});

				//result = "[INIT]"+n[1];
			} else if (n[0]=="input_type") {
				result = "";

				var needs_or = false;

				if (n[1] & 1) {
					result += "InputType.Mob";
					needs_or = true;
				}

				if (n[1] & 2) {
					if (needs_or)
						result+=" | ";
					else
						needs_or=true;
					result += "InputType.Obj";
				}

				if (n[1] & 4) {
					if (needs_or)
						result+=" | ";
					else
						needs_or=true;
					result += "InputType.Str";
				}

				if (n[1] & 8) {
					if (needs_or)
						result+=" | ";
					else
						needs_or=true;
					result += "InputType.Num";
				}

				if (n[1] & 16) {
					if (needs_or)
						result+=" | ";
					else
						needs_or=true;
					result += "InputType.File";
				}

				if (n[1] & 32) {
					if (needs_or)
						result+=" | ";
					else
						needs_or=true;
					result += "InputType.Tile";
				}

				if (n[1] & 64) {
					if (needs_or)
						result+=" | ";
					else
						needs_or=true;
					result += "InputType._ERR1";
				}

				if (n[1] & 128) {
					if (needs_or)
						result+=" | ";
					else
						needs_or=true;
					result += "InputType.Null";
				}

				if (n[1] & 256) {
					if (needs_or)
						result+=" | ";
					else
						needs_or=true;
					result += "InputType.Zone";
				}

				if (n[1] & 512) {
					if (needs_or)
						result+=" | ";
					else
						needs_or=true;
					result += "InputType.Icon";
				}

				if (n[1] & 1024) {
					if (needs_or)
						result+=" | ";
					else
						needs_or=true;
					result += "InputType.Sound";
				}

				if (n[1] & 2048) {
					if (needs_or)
						result+=" | ";
					else
						needs_or=true;
					result += "InputType.StrMultiline";
				}

				if (n[1] & 4096 || n[1]==0) {
					if (needs_or)
						result+=" | ";
					else
						needs_or=true;
					result += "InputType.Any";
				}

				if (n[1] & 131072) {
					if (needs_or)
						result+=" | ";
					else
						needs_or=true;
					result += "InputType.Color";
				}

				/*if (n[1] >= 8192) {
					if (needs_or)
						result+=" | ";
					else
						needs_or=true;
					result += "InputType.__ERR3";
				}*/
			} else {
				result = "BAD_GOOFY_EXPANSION"+n[0];
			}
		} else if (typeof(n)=="number") {
			if (n== 9.999999848243207e+30)
				result = "Double.PositiveInfinity";
			else if (n== -9.999999848243207e+30)
				result = "Double.NegativeInfinity";
			else {
				result = n.toString();
				if (n % 1 != 0 && result.indexOf("e")===-1) {
					var dot_index = result.indexOf(".");
					var trips_0_index = result.indexOf("000",dot_index+2);
					var trips_9_index = result.indexOf("999",dot_index+2);

					if (trips_0_index!==-1)
						result = result.substring(0,trips_0_index);
					else if (trips_9_index!==-1) {
						result = result.substring(0,trips_9_index-2) + parseInt(result[trips_9_index-1])+1;
					}

					//if (dot_index===-1)
					//	console.log("WTF");

					//if (result.indexOf(".")!==-1)
					//	console.log(">>>",result);
				}
			}
		} else {
			result = n.toString();
		}
		return result;

	}

	function expand_list(l,tabs,is_initializer) {
		if (tabs==null)
			tabs=0;
		var txt="\t".repeat(tabs);
		l.forEach(function(n,i) {
			var dropline = n instanceof NodeIfElse || n instanceof NodeWhile || n instanceof NodeDoWhile || n instanceof NodeSwitch || n instanceof NodeTryCatch || n instanceof NodeForEach;

			if (dropline)
				txt+="\n";

			if (i!=0 /*|| dropline*/)
				txt+="\n"+"\t".repeat(tabs);
			else if (dropline)
				txt+="\t".repeat(tabs);

			if (n instanceof NodeTernary) {
				txt += "if ( "+expand_node(n.cond,null,null,"bool")+" ) "+expand_node(n.node_true) + "; else " + expand_node(n.node_false) + ";";
			} else if ( n != null ) {
				var ex = expand_node(n,tabs);
				if (ex!=null) {
					if (is_initializer && n instanceof NodeReturn)
						return;

					txt+= ex;
					
					if (is_initializer) {
						if (l[i+1] instanceof NodeReturn)
							return
						txt+=",";
					}
					else if (!(n instanceof NodeIfElse || n instanceof NodeSwitch || n instanceof NodeWhile || n instanceof NodeDoWhile || n instanceof NodeForEach || n instanceof NodeTryCatch || (n instanceof NodeReturn && n.warning!=null)))
						txt+=";";
				}
			}
			
		});
		return txt;
	}

	function expand_args(l,cont,tabs,f,force_cast,force_params) {
		if (l.length==0)
			return cont?" )":"()";
		var txt=cont?", ":"( ";

		var max_len = l.length;
		if (f!=null && !f.uses_arglist && f.args!=null && f.args.length<max_len)
			max_len = f.args.length;

		for (var i=0;i<max_len;i++) {
			var n = l[i];
			// WHY DID THIS EXIST?
			/*if (f!=null && f.args!=null && f.args[i]==null && !f.uses_arglist) {
				//txt+="??TERM";
				return "[WHAT ARE YOU]";
			}*/
			if (i>0)
				txt+=", ";

			var block_param = false;

			if (force_params) {
				block_param = true;
				if (n instanceof NodeLocalVar && n.argument_hint) {
					block_param = false;
				}
			}

			if (block_param)
				txt+="/* Bad Super Arg: [";

			var cast_type = null;
			if (force_cast) {
				if (f==null) {
					console.log("WARN, FORCE CAST HAS NO FUNCTION!");
				} else {
					function is_thing_dynamic(some_thing) {
						return some_thing==null || some_thing=="dynamic";
					}
					var nt = name_lib.get_type(n);
					if (is_thing_dynamic(nt) || (n instanceof NodeBinary && is_thing_dynamic(name_lib.get_type(n.right)))) {
						var cast_type;
						if (i < f.args.length)
							cast_type = f.args[i].type;

						if (cast_type==null || cast_type=="dynamic")
							cast_type="object"
					}
				}
			} else if (f!=null && f.args!=null && f.args[i]!=null) {
				var present_class = pipe_data.map_classes[name_lib.get_type(n)];
				var expected_class = pipe_data.map_classes[f.args[i].type];
				if (present_class != null && expected_class != null) {
					while (present_class != null) {
						if (present_class == expected_class) {
							expected_class = null;
							break;
						}
						present_class = present_class.parent;
					}
					if (expected_class != null) {
						cast_type = expected_class.name;
					}
				}
			}
			if (cast_type!=null)
				txt+="("+cast_type+")(";
			
			if (f!=null && f.args!=null && f.args[i]!=null) {
				txt+=expand_node(n,tabs,null,f.args[i].type);
			}
			else
				txt+=expand_node(n,tabs);

			if (cast_type!=null)
				txt+=")";

			if (block_param) {
				txt+="] */ ";
				if (f!=null && f.args!=null && f.args[i]!=null) {
					if (f.args[i].type == "bool")
						txt+="false";
					else if (f.args[i].type == "int" || f.args[i].type == "double")
						txt+="0";
					else
						txt+="null";
				} else
					txt+="null";
			}
		}
		return txt+" )"
	}

	function NodeCall(f,a) {
		this.func = f;
		this.args = a;
	}


	var _SUPPRESS_ = false;

	NodeCall.prototype.expand = function(tabs) {
		if ( this.func instanceof NodeClass || (this.func instanceof Array && this.func[0]=="class") ) {
			var c_name;
			var c_func;

			if (this.func instanceof NodeClass) {
				c_name = this.func.c;
				c_func = (pipe_data.map_classes[this.func.c] || {}).func_ctor;
				//return "new " + this.func.c + expand_args(this.args,false,tabs,(pipe_data.map_classes[this.func.c] || {}).func_ctor);
			}
			else {
				if (this.func[1]=="/exception")
					return "new Exception( "+expand_node(this.args[0])+" )";
				c_name = pipe_data.classes[this.func[1]].name;
				c_func = pipe_data.classes[this.func[1]].func_ctor;
				//return "new " + pipe_data.classes[this.func[1]].name + expand_args(this.args,false,tabs, pipe_data.classes[this.func[1]].func_ctor );
			}

			if (c_func==null)
				return "new " + c_name + ( (this.args.length>0)?"( /* Pruned args, no ctor exists. */ )":"()" );

			return "new " + c_name + (expand_args(this.args,false,tabs,c_func)||"[WTF_IS_THIS]");
		}
		else if (this.func instanceof Array && this.func[0]=="list_ctor")
			return "new ByTable" + expand_args(this.args,false,tabs);
		else if (this.func instanceof Array && this.func[0]=="initializer")
			return "new " + pipe_data.classes[this.func[1]].name + expand_args(this.args,false,tabs, pipe_data.classes[this.func[1]].func_ctor ) + " {\n"+expand_list(pipe_data.initializers[this.func[2]].dc,tabs+1,true)+"\n"+"\t".repeat(tabs)+"}";
		else if (this.func instanceof NodeGlobalFunc)
			return "GlobalFuncs."+this.func.f.varData.name + expand_args(this.args,false,tabs,this.func.f);
		else if (this.func instanceof NodeIndex) {
			var the_f = this.func.get_f();

			var should_cast = (this.func.base instanceof NodeSuper);
			var base_is_class = (this.func.base instanceof NodeClass);
			if (this.func.key!= null && this.func.key[0]=="%")
				return this.func.expand(tabs,"_SIMPLE_INDEX_") + expand_args(this.args,true,tabs,the_f,should_cast);
			var expanded_f = this.func.expand(tabs,"_SIMPLE_INDEX_");

			if (expanded_f==null)
				return;
			if ((the_f != null && the_f.dc==null) || (!base_is_class && this.func.key[0] != "$" && this.func.key[0] != "/"))// && !(this.func.base instanceof NodeClass))
				return "Lang13.Call( "+ expanded_f + expand_args(this.args,true,tabs);
			return expanded_f + expand_args(this.args,false,tabs,the_f,should_cast);
		}
		else if (this.func instanceof NodeSuper) {
			//console.log("sooper",this.func.class,(pipe_data.map_classes[this.func.class] || {}).func_ctor);
			return this.func.expand() + expand_args(this.args,false,tabs,this.func.class.func_ctor,true,true);
		}
		return "Lang13.Call( "+expand_node(this.func) + expand_args(this.args,true,tabs);
	}

	NodeCall.prototype.type = function() {
		//console.log("[START]",expand_node(this.func));

		this.args.forEach(function(a) {
			name_lib.get_type(a);
		});

		if (this.func instanceof Array && this.func[0]=="class") {
			if (pipe_data.classes[this.func[1]].func_ctor != null)
				this.suggest_args(pipe_data.classes[this.func[1]].func_ctor);
			
			var cname = pipe_data.classes[this.func[1]].name;
			
			return cname;
		} else if (this.func instanceof Array && this.func[0]=="initializer") {
			if (pipe_data.classes[this.func[1]].func_ctor != null)
				this.suggest_args(pipe_data.classes[this.func[1]].func_ctor);

			return pipe_data.classes[this.func[1]].name;
		} else if (this.func instanceof NodeClass) {
			if (pipe_data.map_classes[this.func.c] != null && pipe_data.map_classes[this.func.c].func_ctor != null)
				this.suggest_args(pipe_data.map_classes[this.func.c].func_ctor);
			
			return this.func.c;
		} else if (this.func instanceof NodeLocalVar) {
			
			return "dynamic";
		} else if (this.func instanceof NodeIndex) {
			//this.func.type(); // needed for base suggestion
			var _if = this.func.get_f();
			if (_if != null && _if.args != null) {
				this.suggest_args(_if);
				return _if.varData.type;
			}
			return "dynamic";
		} else if (this.func instanceof NodeGlobalFunc) {
			this.suggest_args(this.func.f);
			return this.func.f.varData.type;
		} else if (this.func instanceof NodeGlobalVar) {
			
			return "dynamic";
		} else if (this.func instanceof NodeCall) {
			
			return "dynamic";
		} else if (this.func instanceof Array && this.func[0]=="list_ctor") {
			//console.log(">",this.args.length)
			
			return "ByTable";
		} else if (this.func instanceof Array && this.func[0]=="proc") {
			// FUCK ALL YALL
		} else if (this.func instanceof NodeSuper) {
			this.suggest_args(this.func.class.func_ctor);
		} else {
			console.log("[call type] "+this.func.constructor.name+" "+this.func[0]+" "+this.expand());
		}
		//console.log(">"+this.expand());
		//console.log("[expand-start]");
		//var ddd = this.func.key;
		//console.log("[expand-end]");
		//console.log("z->",ddd);
		//console.log(">",this.expand());
		
		//if (getCallStackSize()>10)
		//	throw "HOOAH";
		
		//if (this.func.expand() == 'new Txt().item( user ).str( " drapes " ).item( I ).str')
		//	debugger;// "BONE-ZONE";

		/*if (!_SUPPRESS_) {
			_SUPPRESS_=true;
			console.log(">",this.func.expand());
			_SUPPRESS_=false;
		}*/
		
		//var nmnnn = name_lib.get_type(this.func);
		
		

		//console.log("<-z",ddd);
		//return nmnnn;
	}

	NodeCall.prototype.suggest_args = function(f) {
		//console.log("s",f.varData.name);
		//if (getCallStackSize()>1000) {
		//	console.log("BAIL");
		//}
		//console.log("s int");
		for (var i=0;i<f.args.length;i++) {
			//console.log("-> ",this.args[i]);
			//var at = name_lib.get_type(this.args[i]);
			//console.log("<- ",at);
			//if (f.args[i]!=null) {
				f.args[i].suggest(this.args[i]);//, false, true);
				suggest_type( this.args[i], f.args[i].type, true, true);
			//}

			//console.log("->",i,this.args[i]);
		}
		//console.log("s done");
	}

	function NodeListCall(f,a) {
		this.func = f;
		this.args = a;
	}

	NodeListCall.prototype.expand = function(tabs) {
		if (this.inner_f!=null) {
			return this.inner_f.expand(tabs);
		}
		return expand_node(this.args,tabs)+".Apply( "+expand_node(this.func,tabs)+" )";
	}

	NodeListCall.prototype.type = function() {

		if (this.inner_f==null && this.args instanceof NodeList) {
			var real_f;
			if (this.func instanceof Array) {
				if (this.func[0]=="class") {
					real_f = pipe_data.classes[this.func[1]].func_ctor;
				} else {
					console.log("Cannot reduce listcall of type: A "+this.func[0]);
				}
			} else if (this.func instanceof NodeClass) {
				real_f = pipe_data.map_classes[this.func.c].func_ctor;
			} else if (this.func instanceof NodeGlobalFunc) {
				real_f = this.func.f;
			} else if (this.func instanceof NodeIndex) {
				real_f = this.func.get_f();
			} else {
				console.log("Cannot reduce listcall of type: "+this.func.constructor.name);
			}
			if (real_f!=null && real_f.args!=null) {
				var arg_names = [];

				real_f.args.forEach(function(a) {arg_names.push(a.name);});

				if (!(this.args.data instanceof Map))
					throw "this is so fuckin broken! "+expand_node(this.func);

				var generated_args = [];
				this.args.data.forEach(function(v,k) {
					if (typeof(k)=="number") {
						//console.log("set "+k+" = "+v);
						generated_args[k-1]=v;
					} else if (typeof(k)=="string") {
						var arg_index = arg_names.indexOf(k);
						
						if (arg_index===-1) {
							arg_index = arg_names.indexOf("_"+k);

							if (arg_index===-1) {
								arg_index = arg_names.indexOf("__"+k);

								if (arg_index===-1) {
									//console.log(real_f.varData.name,arg_names,"======>",k);
									return;
								}
							}
						}
						//console.log("set "+k+"/"+arg_index+" = "+v);
						generated_args[arg_index] = v;
					} else {
						throw "this is VERY fuckin broken.";
					}
				});

				//console.log(JSON.stringify(generated_args));
				//throw "bunt";
				this.inner_f = new NodeCall(this.func,generated_args);

				
				//console.log("Can't find function for: "+this.func);
			}
		}

		//console.log("-- "+f+" -- "+a.constructor.name);

		if (this.inner_f!=null) {
			return this.inner_f.type();
		}
	}



	var prec_tbl = {
		// lvl 0 -> unary

		"*": 1,
		"/": 1,
		"%": 1,

		"+": 2,
		"-": 2,

		">>": 3,
		"<<": 3,

		">": 4,
		"<": 4,
		">=": 4,
		"<=": 4,
		"is": 4,
		"as": 4,

		"==": 5,
		"!=": 5,

		"&": 6,
		"^": 7,
		"|": 8,

		"&&": 9,
		"||": 10,
		"??": 11//,

		//"in": 0

		// lvl 12 -> ternary
		// lvl 13 -> asn
	}

	/*function op_is_asn(o) {
		if (o=="=") return true;
	}*/

	function NodeBinary(l,o,r) {
		this.left = l;
		this.op = o;
		this.right = r;
	}

	NodeBinary.prototype.expand = function(tabs,prec) {
		if (this.op=="in") {
			return expand_node(this.right)+".contains( "+expand_node(this.left)+" )";
		}

		var paren=false;

		var my_prec = prec_tbl[this.op];

		if (prec!=null && prec<my_prec) {
			paren=true;
		}

		/*var rhs_prec = my_prec;
		var expand_f = expand_node;
		if (this.op!="||" && this.op!="&&")
			rhs_prec--;
		else
			expand_f = expand_bool;

		var lhs_type = name_lib.get_type(this.left);

		var force_num = false;
		if (expand_f == expand_node && (lhs_type == "int" || lhs_type=="double" || lhs_type=="bool") ) {
			if (this.op=="+" || this.op=="-" || this.op=="*" || this.op=="/" || this.op=="+=" || this.op=="|=" || this.op==">" || this.op=="<" || this.op==">=" || this.op=="<=") {
				//if (this.op=="+=")
				//	return "~~dingle~~";
				force_num = true;
			}
			var rhs_type = name_lib.get_type(this.right);
			if ( (this.op=="==" || this.op=="!=") && (rhs_type == "int" || rhs_type=="double" || rhs_type=="bool") && ( (lhs_type=="bool" || rhs_type=="bool") && lhs_type != rhs_type) ) {
				force_num = true;
			}
		}

		var e_lhs;
		if (this.op=="=" && this.left instanceof NodeThis)
			e_lhs = "Task13.source";
		else
			e_lhs = expand_f(this.left,tabs,my_prec,force_num);

		var e_rhs

		if (this.op=="=" && lhs_type!="bool" && lhs_type!="dynamic" && lhs_type!=null)
			force_num = true;

		if ((this.op == "is" || this.op == "as") && this.right instanceof Array && this.right[0]=="class")
			e_rhs = pipe_data.classes[this.right[1]].name;
		else if (this.op == "is" && this.right instanceof NodeClass)
			e_rhs = this.right.c;
		else if ((this.op == "is" || this.op == "as") && this.right instanceof Array && this.right[0]=="list_ctor")
			e_rhs = "ByTable";
		else if (this.op=="=" && this.right==null && (lhs_type=="int" || lhs_type=="double"))
			e_rhs = 0;
		else if (this.op=="=" && this.right==null && lhs_type=="bool")
			e_rhs = false;
		else if (this.op=="=" && (lhs_type=="bool" || lhs_type=="bool?") )
			e_rhs = expand_bool(this.right,tabs,rhs_prec);
		else if (lhs_type=="bool" && ( (this.op=="==" && this.right===1) || (this.op=="!=" && this.right===0) ) )
			return e_lhs;
		else if (lhs_type=="bool" && ( (this.op=="==" && this.right===0) || (this.op=="!=" && this.right===1) ) )
			return expand_bool(this.left,null,prec,true);
		else if (lhs_type=="double" && ( this.op=="&=" || this.op=="|=" || this.op=="^=" || this.op=="<<=" || this.op==">>=")) {
			var e_rhs = expand_node(this.right,tabs,null,true);
			if (name_lib.get_type(this.right)=="double")
				e_rhs = "(int)" + e_rhs;
			return e_lhs + " = ((int)" + e_lhs + ") " + this.op.slice(0, -1) + " (" + e_rhs + ")";
		}
		else
			e_rhs = expand_f(this.right,tabs,rhs_prec,force_num);

		if (this.op=="<<" || this.op==">>" || this.op=="&" || this.op=="|" || this.op=="^") {
			if (lhs_type == "double") {
				e_lhs = "((int)"+e_lhs+")";
			}
			if (name_lib.get_type(this.right) == "double") {
				e_rhs = "((int)"+e_rhs+")";
			}
		}

		if (this.op=="=" && this.left instanceof NodeIndex && name_lib.get_type(this.left.base)=="ByTable" && this.left.key=="len" && name_lib.get_type(this.right) == "double") {
			e_rhs = "((int)("+e_rhs+"))";
		}

		if (lhs_type=="string" && this.op=="-") {
			e_lhs = "((dynamic)"+e_lhs+")";
		}

		if (!force_num && (this.op=="==" || this.op=="!=") ) {
			var temp = new name_lib.NodeVar();
			temp.freebird = true;
			temp.type = lhs_type;
			var rhs_type_eyyyo = name_lib.get_type(this.right);
			temp.suggest(rhs_type_eyyyo,true);
			if (temp.type != lhs_type && temp.type != rhs_type_eyyyo) {
				e_lhs= "((dynamic)("+e_lhs+"))";
			}
		}*/

		var EMPTY_SIGNAL = {};

		var e_lhs = EMPTY_SIGNAL;
		var e_rhs = EMPTY_SIGNAL;

		///

		if (this.op=="=") {
			e_rhs = expand_node(this.right,tabs,my_prec,name_lib.get_type(this.left));
			if (this.left instanceof NodeThis) {
				e_lhs = "Task13.Source";
			}
			if (this.right instanceof NodeIndexList && this.right.is_save) {
				e_rhs = expand_node(this.right.base,tabs) + ".ReadItem( " + expand_node(this.right.key,tabs)  + ", " + expand_node(this.left,tabs) + " )";
			}
			else {
				//var t_l = name_lib.get_type(this.left);
				//e_rhs = expand_node(this.right,tabs,null,t_l);
				
				//e_rhs+="/*"+t_l+"*/"
				/*if (this.right instanceof NodeIndex && this.right.key=="override") {
					console.log("------=========>>")
				}
				if (this.right instanceof NodeIndex && this.right.key=="v_override") {
					console.log("------=====DD====>>")
				}*/
			}
		} else if (this.op=="+=" || this.op=="-=" || this.op=="*=" || this.op=="%=") {
			var t_l = name_lib.get_type(this.left);
			if (t_l == "ByTable") {
				if (this.op=="+=") {
					return expand_node(this.left,tabs,0) + ".Add( " + expand_node(this.right,tabs) + " )";
				} else if (this.op=="-=") {
					return expand_node(this.left,tabs,0) + ".Remove( " + expand_node(this.right,tabs) + " )";
				}
			}
			if (t_l == "bool" || t_l == "int" || t_l == "bool?" || t_l == "int?" || name_lib.get_type(this.right)=="bool") {
				e_rhs = expand_node(this.right,tabs,my_prec,"int");
			}
			else if (t_l == "double" || t_l == "double?") {
				e_rhs = expand_node(this.right,tabs,my_prec,"double");
			}
		} else if (this.op=="/=") {
			var t_l = name_lib.get_type(this.left);
			if (t_l == "bool" || t_l == "int" || t_l == "bool?" || t_l == "int?" || t_l == "double" || t_l == "double?") {
				e_rhs = expand_node(this.right,tabs,my_prec,"double");
			}
		} else if (this.op=="|=" || this.op=="&=" || this.op=="^=" || this.op=="<<=" || this.op==">>=") {
			var t_l = name_lib.get_type(this.left);
			if (t_l == "ByTable") {
				if (this.op=="|=") {
					return expand_node(this.left,tabs,0) + ".Or( " + expand_node(this.right,tabs) + " )";
				} else if (this.op=="&=") {
					return expand_node(this.left,tabs,0) + ".And( " + expand_node(this.right,tabs) + " )";
				} else if (this.op=="^=") {
					return expand_node(this.left,tabs,0) + ".Xor( " + expand_node(this.right,tabs) + " )";
				}
			}
			if (t_l == "bool" || t_l=="int" || t_l == "bool?" || t_l=="int?") {
				e_rhs = expand_node(this.right,tabs,my_prec,"int");
			}
			if (t_l == "double" || t_l == "double?") {
				e_lhs = expand_node(this.left,tabs);
				e_rhs = expand_node(this.right,tabs,null,"int");
				return e_lhs+" = ((int)( "+e_lhs+" )) "+this.op.slice(0, -1)+" ( "+e_rhs+" )";
			}
		} else if (this.op=="is") {
			if (this.right instanceof Array && this.right[0]=="class")
				e_rhs = pipe_data.classes[this.right[1]].name;
			else if (this.right instanceof NodeClass)
				e_rhs = this.right.c;
			else if (this.right instanceof Array && this.right[0]=="list_ctor")
				e_rhs = "ByTable";
		} else if (this.op=="==" || this.op=="!=") {
			var t_l = name_lib.get_type(this.left);
			if (t_l == "bool") {
				if ((this.op=="==" && this.right===1) || (this.op=="!=" && this.right===0)) {
					return expand_node(this.left,tabs,prec,"bool");
				}
				else if ((this.op=="==" && this.right===0) || (this.op=="!=" && this.right===1)) {
					return "!"+expand_node(this.left,tabs,0,"bool");
				}
			}/* else if (t_l == "bool?") {
				if (this.right===0)
					e_rhs = "false";
				else if (this.right===1)
					e_rhs = "true";
			}*/

			if (e_lhs==EMPTY_SIGNAL && e_rhs==EMPTY_SIGNAL) {
				var t_l = name_lib.get_type(this.left);
				var t_r = name_lib.get_type(this.right);

				var temp = new name_lib.NodeVar();
				temp.freebird = true;
				temp.type = t_l;
				temp.suggest(t_r,true);
				var t = temp.type;

				e_lhs = expand_node(this.left,tabs,my_prec,t);
				e_rhs = expand_node(this.right,tabs,my_prec,t);
			}
		} else if (this.op=="&&" || this.op=="||") {
			e_lhs = expand_node(this.left,tabs,my_prec,"bool");
			e_rhs = expand_node(this.right,tabs,my_prec,"bool");
		} else if (this.op=="+" || this.op=="-" || this.op=="*" || this.op=="/" || this.op=="%") {
			var this_type = this.type();
			e_lhs = expand_node(this.left,tabs,my_prec,this_type);
			e_rhs = expand_node(this.right,tabs,my_prec-1,this_type);
		} else if (this.op==">" || this.op=="<" || this.op=="<=" || this.op == ">=") {
			e_lhs = expand_node(this.left,tabs,my_prec,"double");
			e_rhs = expand_node(this.right,tabs,my_prec,"double");
		} else if (this.op=="&" || this.op=="|" || this.op=="^" || this.op=="<<" || this.op==">>") {
			var t_l = name_lib.get_type(this.left);
			if (t_l == "bool" || t_l == "int" || t_l == "bool?" || t_l == "int?" || t_l == "double" || t_l == "double?") {
				e_lhs = expand_node(this.left,tabs,my_prec,"int");
				e_rhs = expand_node(this.right,tabs,my_prec-1,"int");
			}
		}

		///

		if (e_lhs==EMPTY_SIGNAL)
			e_lhs = expand_node(this.left,tabs,my_prec);

		if (e_rhs==EMPTY_SIGNAL)
			e_rhs = expand_node(this.right,tabs,my_prec);

		if (paren)
			return "( "+e_lhs +" "+this.op+" "+ e_rhs+" )";
		return e_lhs +" "+this.op+" "+ e_rhs;
	}

	NodeBinary.prototype.type = function(f) {
		

		var t_l = name_lib.get_type(this.left);
		var t_r = name_lib.get_type(this.right);

		// Unconst const vars!
		if (this.op=="=" || this.op=="+=" || this.op=="-=" || this.op=="*=" || this.op=="/=" || this.op=="%=" || this.op=="&=" || this.op=="|=" || this.op=="^=" || this.op=="<<=" || this.op==">>=") { // OR ANY OTHER ASNMENT - TODO CHECK BY PREC
			if (this.left instanceof NodeGlobalVar) {
				if (this.left._var._const)
					this.left._var._const = false;
			}
		}

		if (this.op=="=") {
			suggest_type(this.left,this.right);
		}
		else if (this.op=="==" || this.op=="!=" || this.op=="<" || this.op==">" || this.op=="<=" || this.op==">=") {

			//TYPE INFERENCE MAY BE NECESSARY!
			if (!(this.left instanceof NodeGlobalVar))
				suggest_type(this.left,this.right,false,true);

			if (!(this.right instanceof NodeGlobalVar))
				suggest_type(this.right,this.left,false,true);

			return "bool";
		}
		else if (this.op=="+=" || this.op=="-=" || this.op=="*=" || this.op=="%=") {
			if (t_l == "bool" || t_l=="int" || t_l == "bool?" || t_l=="int?" || t_l == "double" || t_l == "double?") {
				if (t_r=="bool" || t_r=="bool?" || t_r=="int" || t_r=="int?")
					suggest_type(this.left,"int",true);
				else// if (t_r=="double" || t_r=="double?")
					suggest_type(this.left,"double",true);
			}
		}
		else if (this.op=="/=") {
			if (t_l == "bool" || t_l=="int" || t_l == "bool?" || t_l=="int?" || t_l == "double" || t_l == "double?") {
				suggest_type(this.left,"double",true);
			}
		}
		else if (this.op=="|=" || this.op=="&=" || this.op=="^=" || this.op=="<<=" || this.op==">>=") {
			if (t_l == "bool" || t_l=="int" || t_l == "bool?" || t_l=="int?" || t_l == "double" || t_l == "double?") {
				suggest_type(this.left,"int",true);
			}
		}
		else if (this.op=="is") {
			var sug_t = null;
			if (this.right instanceof Array && this.right[0]=="class")
				sug_t = pipe_data.classes[this.right[1]].name;
			else if (this.right instanceof NodeClass)
				sug_t = this.right.c;
			else if (this.right instanceof Array && this.right[0]=="list_ctor")
				sug_t = "ByTable";
			//if (t_l != null)
			//	suggest_type(this.left,sug_t,true,true);

			return "bool";
		}
		else if (this.op=="&&" || this.op=="||") {
			// I don't think we need any fuckery here.

			return "bool";
		}
		else if (this.op=="+" || this.op=="-" || this.op=="*" || this.op=="%") {
			if ((t_l == "bool" || t_l=="int" || t_l == "bool?" || t_l=="int?") && (t_r == "bool" || t_r=="int" || t_r == "bool?" || t_r=="int?")) {
				return "int";
			}
			else if (t_l == "bool" || t_l=="int" || t_l == "bool?" || t_l=="int?" || t_l == "double" || t_l == "double?") {
				return "double";
			}
			else if (this.op=="-" && t_l == "string" && (t_r == "bool" || t_r=="int" || t_r == "bool?" || t_r=="int?" || t_r == "double" || t_r == "double?")) { // force dynamic on dumb strings that want subtraction
				suggest_type(this.left,"dynamic",true);
			}
			return t_l;
		}
		else if (this.op=="/") {
			if (t_l == "bool" || t_l=="int" || t_l == "bool?" || t_l=="int?" || t_l == "double" || t_l == "double?") {
				return "double";
			}
			return t_l;
		}
		else if (this.op=="&" || this.op=="|" || this.op=="^" || this.op=="<<" || this.op==">>") {
			if (t_l == "bool" || t_l == "int" || t_l == "bool?" || t_l == "int?" || t_l == "double" || t_l == "double?") {
				return "int";
			}
			return t_l;
		}


		/*
		if (this.op=="=" || this.op=="+=" || this.op=="-=" || this.op=="*=" || this.op=="/=" || this.op=="%=" || this.op=="&=" || this.op=="|=" || this.op=="^=" || this.op=="<<=" || this.op==">>=") { // OR ANY OTHER ASNMENT - TODO CHECK BY PREC
			if (this.left instanceof NodeGlobalVar) {
				if (this.left._var._const)
					this.left._var._const = false;
			}
		}
		if (this.op=="=" || (this.op=="+=" && t_r == "string" && (t_l=="void" || t_l=="int") ) || this.op == "is" ) {
			var sv = this.right;
			var sr = false;

			if (this.op=="is") {
				if (this.right instanceof NodeClass) {
					t_r = this.right.c;
				} else if (this.right instanceof Array && this.right[0]=="class") {
					t_r = pipe_data.classes[this.right[1]].name;
				} else if (this.right instanceof Array && this.right[0]=="list_ctor") {
					t_r = "ByTable";
				}

				if (t_r=="string" || t_r=="bool" || t_r=="int" || t_r=="double")
					t_r = "dynamic";

				sv = t_r;
				sr = true;
			}

			suggest_target = this.left;
			if (this.op=="in") {
				suggest_target = this.right;
				sv = "ByTable";
				sr = true;
			}

			if (suggest_target instanceof NodeLocalVar || suggest_target instanceof NodeGlobalVar || suggest_target instanceof NodeDefault) {
				if (suggest_target._var.suggest) {
					suggest_target._var.suggest( sv , sr );
				}
			} else if (suggest_target instanceof NodeIndexList) {
				// may need this later... for now... fuck it
			} else if (suggest_target instanceof NodeIndex) {
				var ff = suggest_target.get_f();

				if (ff!=null) {
					//console.log("suggestive!");
					ff.varData.suggest(sv,sr);
				}
			}
		}

		/*if (this.op=="==" && (t_l=="string" || t_r=="string") && (t_l != t_r) ) { // TODO GENERALIZE
			suggest_type(this.left,"string",true);
			suggest_type(this.right,"string",true);
		}*

		if (this.op=="==") {
			suggest_type(this.left,t_r,true);
			suggest_type(this.right,t_l,true);
		}



		var promote_ops = {
			"*": true,"/": true,"%": true,"+": true,"-": true,">>": true,"<<": true,">": true,"<": true,">=": true,"<=": true,"&": true,"^": true,"|": true,
			"*=": true,"/=": true,"%=": true,"+=": true,"-=": true,"&=":true,"|=":true,"^=":true,">>=":true,"<<=":true
		}

		if ( (t_l=="bool" || t_r=="bool") && promote_ops[this.op] ) {

			suggest_type(this.left,"int",true);
			suggest_type(this.right,"int",true);
			
		}

		if ( (t_l=="int" && t_r=="double") && promote_ops[this.op] ) {
			suggest_type(this.left,"double",true);
		}

		if (t_l=="bool" && t_r=="int" && this.right !== 0 && this.right !== 1 ) {
			suggest_type(this.left,"int",true);
		}

		if (this.op == "as") {
			//console.log("=>",this.right[1],pipe_data.classes[this.right[1]].name);
			if (this.right[0]=="list_ctor")
				return "ByTable";
			if (pipe_data.classes[this.right[1]]!=null)
				return pipe_data.classes[this.right[1]].name;
			console.log("x->",this.right[1],expand_node(this));
			return null;
		}

		if (this.op=="&&" || this.op=="||")
			return "bool";
		if (this.op=="==" || this.op=="!=" || this.op=="<" || this.op==">" || this.op=="<=" || this.op==">=")
			return "bool";
		if (this.op=="is" || this.op=="in")
			return "bool";

		if (t_r=="double" && t_l=="int")
			return "double";

		if ((t_l=="bool" || t_l=="int" || t_l=="double") && this.op=="/") {
			return "double";
		}

		if (t_l=="bool" && (this.op=="+" || this.op=="-" || this.op=="*" || this.op=="%" || this.op=="<<" || this.op==">>"))
			return "int";
		*/

		//return t_l;
	}

	function NodeUnary(o,t,p) {
		this.op = o;
		this.target=t;
		this.postfix=p;
	}

	NodeUnary.prototype.expand = function(tabs,prec) {
		var str;

		//if (this.op=="!") 
		//	str= "not "+expand_node(this.target,null,2);
		//else
		
		/*if (this.op=="!") {
			return expand_node(this.target,tabs,prec,"!bool");
		}*/

		var t = this.type();

		if (this.postfix)
			str= expand_node(this.target,tabs,0,t)+this.op;
		//else if (this.op=="~" && name_lib.get_type(this.target)=="double")
		//	str= "~((int)"+expand_node(this.target,tabs,0)+")"

		else {
			/*if (this.op=="!" && this.target instanceof NodeBinary && (this.target.op=="==" || this.target.op=="!=") ) {
				if (this.target.op=="==")
					this.target.op = "!=";
				else
					this.target.op = "==";
				return expand_node(this.target,tabs);
			} else*/
			str= this.op+expand_node(this.target,tabs,0,t);
		}



		if (prec==0) //only wrap for other unary ops
			str= "( "+str+" )"
		return str
	}

	NodeUnary.prototype.type = function() {
		var t_inner = name_lib.get_type(this.target);

		if (this.op=="++" || this.op=="++pre" || this.op=="++post" || this.op=="--" || this.op == "--pre" || this.op == "--post") { // OR ANY OTHER ASNMENT - TODO CHECK BY PREC
			if (this.target instanceof NodeGlobalVar) {
				if (this.target._var._const)
					this.target._var._const = false;
			}

			suggest_type(this.target,"int",true);
		}

		if (this.op=="!") {
			devoid(this.target);
			return "bool";
		}
		else if (this.op=="~") {
			if (t_inner=="bool" || t_inner=="bool?" || t_inner=="int" || t_inner=="int?" || t_inner=="double" || t_inner=="double?")
				return "int";
		}
		else if (this.op=="-") {
			if (t_inner=="bool" || t_inner=="bool?" || t_inner=="double?")
				return "double";
			if (t_inner=="int?")
				return "int";
			
			suggest_type(this.target,"int",true);
		}

		return t_inner;
	}

	function NodeLocalVar(v) {
		this._var = v;
	}

	NodeLocalVar.prototype.expand = function() {
		/*if (!this._var.dropped_dec && !this._var.is_arg) {
			this._var.dropped_dec=true;
			return (this._var.type || "dynamic") +" "+this._var.name+"/*DD";
		}*/
		return this._var.name;
	}

	NodeLocalVar.prototype.type = function() {return this._var.type}

	function NodeGlobalVar(v) {
		this._var = v;
	}

	NodeGlobalVar.prototype.expand = function() {
		if (this._var==null)
			return "NULLVAR";
		return "GlobalVars."+this._var.name;
	}

	NodeGlobalVar.prototype.type = function() {
		if (this._var==null)
			return "ERROR_TYPE";
		return this._var.type;
	}

	function NodeDefault(v) {
		this._var = v;
	}

	NodeDefault.prototype.expand = function() {
		return "_default";
	}

	NodeDefault.prototype.type = function() {return this._var.type}

	function NodeHole(t,y) {this.txt=t;this._type=y;}

	NodeHole.prototype.expand = function() {
		return this.txt || "_";
	}

	NodeHole.prototype.type = function() {
		return this._type || "dynamic";
	}

	function NodeThis(c,ii) {this.class=c;this.is_initializer=ii}

	NodeThis.prototype.expand = function() {
		return "this";
	}

	NodeThis.prototype.type = function() {
		return this.class;
	}

	function NodeSuper(c) {this.class=c;}

	NodeSuper.prototype.expand = function() {
		return "base";
	}

	function NodeSuperWarning() {}

	NodeSuperWarning.prototype.expand = function() {
		return "// Warning: Super call was HERE! If anything above HERE is needed by the super call, it might break!";
	}

	NodeSuper.prototype.type = function() {
		return this.class.name;
	}

	function NodeGlobalFunc(f,n) {
		this.f = f;
		this.is_node = n;
	}

	NodeGlobalFunc.prototype.expand = function() {
		if (this.is_node)
			return "typeof(GlobalFuncs).GetMethod( "+ expand_node(this.f)+ " )";
		return "typeof(GlobalFuncs).GetMethod( \""+ this.f.varData.name+ "\" )";
	}

	NodeGlobalFunc.prototype.type = function() {
		//console.log("todo fix global func",this.f);
		return "System.Reflection.MethodInfo"; // this can prolly be fixed easy
	}

	function NodeClass(c) {
		this.c = c;
	}

	NodeClass.prototype.expand = function() {
		return "typeof("+this.c+")";
	}

	NodeClass.prototype.type = "Type";

	function NodeTernary(c,t,f) {
		this.cond=c;
		this.node_true = t;
		this.node_false = f;
	}

	NodeTernary.prototype.expand = function(_,prec,force_bool) {

		//

		var ta = name_lib.get_type(this.node_true);
		var tb = name_lib.get_type(this.node_false);

		var temp = new name_lib.NodeVar();
		temp.freebird = true;
		temp.type = ta;
		temp.suggest(tb,true);
		var tc = temp.type;

		//

		/*if (ta == "bool" && tb=="bool" || (ta == "bool" && this.node_false===null) || (tb == "bool" && this.node_true===null)) { // do not take chances, they must both be bools
			base_a = expand_node(this.node_true,null,null,"bool");
			base_b = expand_node(this.node_false,null,null,"bool");
		} else {
			base_a = expand_node(this.node_true);
			base_b = expand_node(this.node_false);
		}*/

		/*var make_dynamic=false;
		if (ta==null || ta=="dynamic" || tb==null || tb=="dynamic") {
																										MIGHT BE ABLE TO USE THIS-> JUST SET TC TO DYNAMIC
		}*/

		var base_a = expand_node(this.node_true,null,null,tc);
		var base_b = expand_node(this.node_false,null,null,tc);


		//if ((t_a=="bool" || t_a=="int" || t_a=="double") && base_b==="null" )
		//	base_b = 0;
		

		if (tc=="dynamic" && ta!="dynamic" && ta!=null)
			base_a= "((dynamic)( "+base_a+" ))";

		if (tc=="dynamic" && tb!="dynamic" && tb!=null)
			base_b= "((dynamic)( "+base_b+" ))";

		if (prec!=null)
			return "( "+expand_node(this.cond,null,null,"bool")+" ? "+base_a+" : "+base_b+" )";
		return expand_node(this.cond,null,null,"bool")+" ? "+base_a+" : "+base_b;
	}

	NodeTernary.prototype.type = function() {
		name_lib.get_type(this.cond);
		var ta = name_lib.get_type(this.node_true);
		var tb = name_lib.get_type(this.node_false);

		/*if ( ( ta=="string" && (tb=="int" || tb=="double") ) || ( tb=="string" && (ta=="int" || ta=="double") ) ) {
			return "string";
		}*/

		var temp = new name_lib.NodeVar();
		temp.freebird = true;
		temp.type = ta;
		temp.suggest(tb,true);

		//if (ta=="bool" && tb=="int")
		//console.log(ta,tb,temp.type);

		//if (temp.type=="bool" && (ta==null || tb==null) )
		//	return "dynamic";

		return temp.type;
	}

	function NodeIfElse(c,t,f) {
		this.cond=c;
		this.list_true = t;
		this.list_false = f;
	}

	NodeIfElse.prototype.expand = function(tabs) {
		var txt = "if ( "+expand_node(this.cond,tabs,null,"bool")+" ) {\n"
		//console.log(this.list_true);
		txt+= expand_list(this.list_true,tabs+1);

		if (this.list_false.length!=0) {
			txt+="\n"+"\t".repeat(tabs)+"} else ";

			if (this.list_false.length==1 && this.list_false[0] instanceof NodeIfElse) {
				txt+=this.list_false[0].expand(tabs);
				//throw ":D";
			} else {
				txt+="{\n";

				txt+= expand_list(this.list_false,tabs+1);

				txt+="\n"+"\t".repeat(tabs)+"}";
			}
		} else {
			txt+="\n"+"\t".repeat(tabs)+"}";
		}

		return txt;
	}

	NodeIfElse.prototype.type = function() {
		name_lib.get_type(this.cond);

		devoid(this.cond);

		name_lib.compute_types(this.list_true);
		name_lib.compute_types(this.list_false);
	}

	function NodeTryCatch(t,v,c) {
		this.list_try = t;
		this.var_ = v;
		this.list_catch = c;
	}

	NodeTryCatch.prototype.expand = function(tabs) {
		var txt = "try {\n"
		//console.log(this.list_true);
		txt+= expand_list(this.list_try,tabs+1);

		txt+="\n"+"\t".repeat(tabs)+"} catch (Exception __) {\n";

		if (this.var_!=null) {
			txt+="\t".repeat(tabs+1)+expand_node(this.var_)+" = __;\n";
		}

		txt+= expand_list(this.list_catch,tabs+1);

		txt+="\n"+"\t".repeat(tabs)+"}";

		return txt;
	}

	NodeTryCatch.prototype.type = function() {
		name_lib.compute_types(this.list_try);
		name_lib.compute_types(this.list_catch);
	}

	function NodeThrow(e) {
		this.ex = e;
	}

	NodeThrow.prototype.expand = function() {
		return "throw "+expand_node(this.ex);
	}

	function NodeSwitch(v,d,h) {
		this.value = v;
		this.data = d;
		this.hole = h;
	}

	NodeSwitch.prototype.expand = function(tabs) {
		var h = this.hole;

		function check_has_break_r(list) {

			list.forEach(function(n) {
				if (n instanceof NodeBreak) {
					return true;
				} else if (n instanceof NodeIfElse) {
					if (check_has_break_r(n.list_true) || check_has_break_r(n.list_false))
						return true;
				} else if (n instanceof NodeTryCatch) {
					if (check_has_break_r(n.list_try) || check_has_break_r(n.list_catch))
						return true;
				} else if (n instanceof NodeSwitch) {
					for (var i=0;i<n.data.length;i++) {
						if (check_has_break_r(n.data[i][2]))
							return true;
					}
				}
			});

		}

		var can_do_sane_expansion = true;

		var the_value_type = name_lib.get_type(this.value);

		if (the_value_type=="double")
			the_value_type = "int";

		if (the_value_type=="double?")
			the_value_type = "int?";

		if (the_value_type != "string" && the_value_type != "int" && the_value_type != "bool" && the_value_type != "int?" && the_value_type != "bool?") {
			can_do_sane_expansion = false;
		} else {

			for (var i=0;i<this.data.length;i++) {
				if (this.data[i][0]=="ranges" || check_has_break_r(this.data[i][2]) ) {
					can_do_sane_expansion = false;
					break;
				}
			}
		}

		//can_do_sane_expansion = false;

		if (can_do_sane_expansion) {

			var txt = "switch (("+(the_value_type || "dynamic")+")( "+expand_node(this.value,tabs)+" )) {\n";

			for (var i=0;i<this.data.length;i++) {
				if (this.data[i][0]=="cases") {
					this.data[i][1].forEach(function(c,j) {
						txt+="\t".repeat(tabs+1)+"case "+ expand_node(c,tabs,null,the_value_type) +":\n";
					});
				} else if (this.data[i][0]=="default") {
					txt+="\t".repeat(tabs+1)+"default:\n";
					
				} else {
					throw "up";
				}
				txt+= expand_list(this.data[i][2],tabs+2)+"\n";
				txt+="\t".repeat(tabs+2)+"break;\n";
				
			}
			txt+="\t".repeat(tabs)+"}";
			return txt;
		}

		var txt = "dynamic "+h+" = "+expand_node(this.value,tabs)+"; // Was a switch-case, sorry for the mess.\n";

		for (var i=0;i<this.data.length;i++) {
			txt+="\t".repeat(tabs);
			if (i>0)
				txt+="} else ";

			if (this.data[i][0]=="cases") {
				txt+="if ( ";
				this.data[i][1].forEach(function(c,j) {
					if (j>0)
						txt+=" || ";
					txt+=(""+h+"=="+expand_node(c,tabs));
				});
				txt+=" ) {\n";
			} else if (this.data[i][0]=="ranges") {
				txt+="if ( ";
				this.data[i][1].forEach(function(c,j) {
					if (j>0)
						txt+=" || ";
					txt+=(expand_node(c[0],tabs)+"<="+h+"&&"+h+"<="+expand_node(c[1],tabs));
				});
				txt+=" ) {\n";
			} else if (this.data[i][0]=="default") {
				txt+="{\n"
			} else {
				throw "FAILURE!!!11";
			}

			if (!(this.data[i][2] instanceof Array)) {
				txt+= "_BIC_PLZ_";
			} else {
				txt+= expand_list(this.data[i][2],tabs+1);
			}

			txt+="\n";

			//txt+="if ("++") {\n"
		}
		txt+="\t".repeat(tabs)+"}";
		return txt;
	}

	NodeSwitch.prototype.type = function() {
		name_lib.get_type(this.value);
		for (var i=0;i<this.data.length;i++) {
			name_lib.compute_types(this.data[i][2]);
		}
	}

	function NodePick(d,y) {
		this.data = d;
		this.dynamic = y;
	}

	NodePick.prototype.expand = function(tabs) {
		var last_n = 0;
		var diff_n=null;
		for (var i=0;i<this.data.length-1;i++) {
			if (diff_n!=null && this.data[i].n-last_n!=diff_n) {
				diff_n=null;
				break;
			} else if (diff_n==null)
				diff_n = this.data[i].n-last_n;
			
			last_n=this.data[i].n;
		}

		if (diff_n!=null && diff_n/(65535-last_n) > .97) { //we have a nice, non-weighted pick!
			var txt = "Rand13.Pick(new object [] { ";

			for (var i=0;i<this.data.length;i++) {
				txt+= expand_node(this.data[i].value);
				if (i<this.data.length-1)
					txt+=", ";
			}

			return txt+" })"
		}
		//else: god damn it

		if (this.dynamic) {
			var txt = "Rand13.PickWeightedDynamic(new object [] { ";

			for (var i=0;i<this.data.length-1;i++) {
				txt+=expand_node(this.data[i].n)+", "+expand_node(this.data[i].value)+", ";
			}

			txt+="}, "+expand_node(this.data[ this.data.length-1 ].value);

			return txt+" )";
		}


		var txt = "Rand13.PickWeighted(new object [] { ";

		for (var i=0;i<this.data.length;i++) {

			if (this.data[i].n==null)
				txt+="65535, "+expand_node(this.data[i].value);
			else
				txt+=expand_node(this.data[i].n)+", "+expand_node(this.data[i].value)+", ";

		}

		return txt+" })";
	}

	NodePick.prototype.type = function() {return null;}

	function NodeWhile(c,b) {
		this.cond=c;
		this.list_body = b;
	}

	NodeWhile.prototype.expand = function(tabs) {
		var txt = "while ("+expand_node(this.cond,tabs,null,"bool")+") {\n"
		txt+= expand_list(this.list_body,tabs+1);
		txt+="\n"+"\t".repeat(tabs)+"}";
		return txt;
	}

	NodeWhile.prototype.type = function() {
		name_lib.get_type(this.cond);
		name_lib.compute_types(this.list_body);
	}

	function NodeDoWhile(c,b) {
		this.cond=c;
		this.list_body = b;
	}

	NodeDoWhile.prototype.expand = function(tabs) {
		function check_has_continue_r(list) {
			list.forEach(function(n) {
				if (n instanceof NodeContinue) {
					return true;
				} else if (n instanceof NodeIfElse) {
					if (check_has_continue_r(n.list_true) || check_has_continue_r(n.list_false))
						return true;
				} else if (n instanceof NodeTryCatch) {
					if (check_has_continue_r(n.list_try) || check_has_continue_r(n.list_catch))
						return true;
				} else if (n instanceof NodeSwitch) {
					console.log("--BADWARNING-->");
				}
			});
		}

		if (check_has_continue_r(this.list_body)) {
			var txt = "while (true) { // Was a do-while, sorry for the mess.\n"
			txt+= expand_list(this.list_body,tabs+1);
			txt+="\n"+"\t".repeat(tabs+1)+"if (!( "+expand_node(this.cond,null,null,"bool")+" )) break;\n"+"\t".repeat(tabs)+"}"

			return txt;
		}

		var txt = "do {\n"
		txt+= expand_list(this.list_body,tabs+1);
		txt+="\n"+"\t".repeat(tabs)+"} while ( "+expand_node(this.cond,null,null,"bool")+" );";

		return txt;

		

		//return "->";
	}

	NodeDoWhile.prototype.type = function() {
		name_lib.get_type(this.cond);
		name_lib.compute_types(this.list_body);
	}

	function NodeForEach(l,b,h) {
		this.target = l;
		this.list_body = b;
		this.hole = h;
	}

	NodeForEach.prototype.expand = function(tabs) {
		var ex_target = null;
		/*if (this.target instanceof NodeClass && this.target.c=="Game13")
			ex_target = "Game13.contents";
		else {
			ex_target = expand_node(this.target,tabs);
		
			var tt = name_lib.get_type(this.target);
			if (tt != "ByTable" && tt != "dynamic" && tt!= null)
				ex_target = "((dynamic)"+ex_target+")"
		}*/

		var txt = "foreach (dynamic "+this.hole+" in "+expand_node(this.target,tabs)+") {";

		if (this.typecode!=null)
			txt+=" // THERE IS A SMALL CHANCE THIS LOOP IS BROKEN! TYPECODE = "+this.typecode;

		txt+="\n";
		txt+=expand_list(this.list_body,tabs+1);
		txt+="\n"+"\t".repeat(tabs)+"}";

		return txt;
	}

	NodeForEach.prototype.type = function() {
		name_lib.get_type(this.target);
		name_lib.compute_types(this.list_body);
		name_lib.compute_types(this.list_body);
	}

	function NodeSpawn(t,b) {
		this.time = t;
		this.body =b;
	}

	NodeSpawn.prototype.expand = function(tabs) {
		var txt = "Task13.Schedule( "+expand_node(this.time,null,null,"int")+", (Task13.Closure)(() => {\n";
		txt+=expand_list(this.body,tabs+1);
		txt+="\n"+"\t".repeat(tabs)+"}))";

		return txt;
	}

	NodeSpawn.prototype.type = function() {
		name_lib.compute_types(this.body);
	}

	function NodeReturn(v,w,vd) {
		this.value=v;
		this.warning = w;
		this.varData = vd;
	}

	NodeReturn.prototype.expand = function(tabs) {

		var warn = "";
		if (this.warning!=null)
			warn = "; // "+this.warning;

		var value_type = name_lib.get_type(this.value);

		if (value_type=="void" || this.use_leader || this.varData==null || this.varData.type=="void") {
			var leader = "";
			if (this.value != null && typeof (this.value) !== "number") {
				if (this.value instanceof NodeTernary) {
					leader += "if ( "+expand_node(this.value.cond,null,null,"bool")+" ) "+expand_node(this.value.node_true) + "; else " + expand_node(this.value.node_false) + "; ";
				} else {
					leader = expand_node(this.value,tabs)+"; ";
				}
			}
			
			if (this.varData!=null && this.varData.type!="void") {
				if (this.varData.type=="int" || this.varData.type=="double")
					return leader+"return 0"+warn;
				else if (this.varData.type=="bool")
					return leader+"return false"+warn;
				else
					return leader+"return null"+warn;
			}

			return leader+"return"+warn;
		}
		


		return "return "+expand_node(this.value,tabs,null,this.varData.type)+warn;
			/*
			if (this.varData!=null && (this.varData.type=="bool" || this.varData.type=="bool?") )
				return "return "+expand_node(this.value,tabs,null,"bool");
			return "return "+expand_node(this.value,tabs);
		
		
		


		if (this.warning!=null)
			return leader+"return; // Warning: Was a jump out of the closure!";
		if (this.varData!=null && this.varData.type!="void") {
			if (this.varData.type=="int" || this.varData.type=="double")
				return leader+"return 0";
			if (this.varData.type=="bool")
				return leader+"return false";
			return leader+"return null";
		}

		return leader+"return";*/
	}

	NodeReturn.prototype.type = function() {
		name_lib.get_type(this.value);
		if (this.varData==null)
			return;
		if (this.do_suggest)
			this.varData.suggest(this.value);
		/*if (name_lib.get_type(this.value)=="void" && this.value instanceof NodeCall && this.value.func instanceof NodeIndex) {
			var f = this.value.func.get_f();
			if (f!=null) {
				f.varData.type = null;
			}
		}*/
		//return this.varData.type;
		//console.log("==>",f.varData.suggest);
	}

	function NodeMinMax(a,m) {
		this.args = a;
		this.mode = m;
	}

	NodeMinMax.prototype.expand = function() {
		var txt = "Num13.M";
		if (this.mode)
			txt+="ax";
		else
			txt+="in";

		var t = this.type();

		if (t=="int")
			txt+="Int";

		txt+="( ";

		this.args.forEach(function(a,i) {
			if (i>0)
				txt+= ", ";
			txt+= expand_node(a,null,null,t);
		});

		txt+=" )";
		return txt;
	}

	NodeMinMax.prototype.type = function() {
		this.args.forEach(function(a) {
			var t = name_lib.get_type(a);
			if (t=="double" || t=="double?")
				return "double";
		});

		return "int";
	}

	function NodeGoto(t) {
		this.target=t;
	}

	NodeGoto.prototype.expand = function() {
		if (this.addr+1==this.target) return "";
		goto_stats++;
		return "throw new Exception(\"Failed to remove goto!\"); // FIXME, GOTO";
	}

	function NodeGotoTrue(c,t) {
		this.cond=c;
		this.target=t;
	}

	NodeGotoTrue.prototype.expand = function() {
		goto_stats++;
		return "throw new Exception(\"Failed to remove goto!\"); // FIXME, GOTO-TRUE";
		//throw "YOU'LL NEVER TAKE ME ALIVE!"
	}

	function NodeBreak(n) {
		this.ctrl_n = n;
	}

	NodeBreak.prototype.expand = function(tabs) {
		if (this.ctrl_n)
			return "_loop_ctrl_"+this.ctrl_n+" = \"break\";\n"+"\t".repeat(tabs)+"break";
		return "break";
	}

	NodeBreak.prototype.type = "void";

	function NodeContinue(n) {
		this.ctrl_n = n;
	}

	NodeContinue.prototype.expand = function(tabs) {
		if (this.ctrl_n)
			return "_loop_ctrl_"+this.ctrl_n+" = \"continue\";\n"+"\t".repeat(tabs)+"break";
		return "continue";
	}

	NodeContinue.prototype.type = "void";

	function NodeIndex(b,k) {
		this.base = b;
		this.key = k;
	}

	NodeIndex.prototype.expand = function(tabs,flag) {
		var f = this.get_f();
		var k = this.key;

		var real_func = false;
		var cast_base = null;

		if (f) {
			if (f.dc) {
				real_func=true;

				var base_c = pipe_data.map_classes[name_lib.get_type(this.base)];
				var required_c = f.this_class;
				
				while (base_c!=null && base_c!=required_c) {
					base_c = base_c.parent;	
				}

				if (base_c!=required_c) {
					cast_base = required_c.name;
				}
				//f.this_class
			}
			k = f.varData.name;//+"/*a-"+0+"-b-"+name_lib.get_type(this)+"-k-"+k+"*/";
		}
		else if (this.base instanceof NodeSuper)
			return "Lang13.SuperCall";
		else if (k!=null && k[0]=="$") {
			real_func=true;
			k = k.substring(1).replace(/ /g,"_");
			var base_t = name_lib.get_type(this.base);
			if (!(this.base instanceof NodeClass) && base_t != null && base_t != "dynamic")
				cast_base = "dynamic";
		}
		else if (k!= null && k[0]=="%") {
			k = "__CallVerb(\"" + k.substring(1) + "\"";
		}
		else if (k[0]=="/") { // for world funcs called in a world func
			k = k.split("/").pop();
		}
		else if (!(this.base instanceof NodeClass)) {
			var base_t = name_lib.get_type(this.base);
			if (base_t != null && base_t != "dynamic")
				cast_base = "dynamic";
		}

		if (k==null)
			k="_BROKEN_INDEX_"

		var expanded_base = null;
		if (this.base instanceof NodeClass)
			expanded_base = this.base.c;
		else
			expanded_base = expand_node(this.base,tabs,-1);
		//if (f && f.name!=null)
		//	return "typeof("+expanded_base+").GetMethod( \""+k+"\" )";
		
		if (real_func && flag!="_SIMPLE_INDEX_")
			return "Lang13.BindFunc( "+expanded_base+", \""+k+"\" )"
		else {
			if (name_lib.map_keywords[k])
				k="v_"+k;
			if (cast_base!=null)
				expanded_base = "(("+cast_base+")"+expanded_base+")";

			if (this.base instanceof NodeThis && this.base.is_initializer) {
				//console.log("~~");
				return k;
			}
			return expanded_base+"."+k;
		}
	}

	NodeIndex.prototype.type = function() {
		//name_lib.get_type(this.base);
		//var t = name_lib.get_type(this.base); //meh
			//return "int";
		var f = this.get_f(); // this does typing

		//if (this.key=="devices" && this.base instanceof NodeIndex && this.base.key=="scanner" && this.base.base instanceof NodeLocalVar && this.base.base._var.name == "user")
		//	console.log("GOTEM "+ name_lib.get_type(this.base) );

		if (f!=null) {
			if (f.varData.type=="Type" && this.key=="call")
				throw "GETTIN MONEY";
			if (f.dc!=null && !f.var_wrapper)
				return "System.Reflection.MethodInfo";
			return f.varData.type;
		}

		return null; // todo return indexed member
	}

	function suggest_type(target,sv,sm,softmode) {
		if (target instanceof NodeLocalVar || target instanceof NodeGlobalVar || target instanceof NodeDefault) {
			if (target._var.suggest) {
				target._var.suggest( sv , sm , softmode );
			}
		} else if (target instanceof NodeIndexList) {
			// may need this later... for now... fuck it
		} else if (target instanceof NodeIndex) {
			var ff = target.get_f();

			if (ff!=null) {
				//console.log("suggestive!");
				ff.varData.suggest( sv ,sm , softmode);
			}
		}
	}

	NodeIndex.prototype.get_f = function() {
		var t = name_lib.get_type(this.base);
		var c = pipe_data.map_classes[t];

		// we can't index these types, drop to dynamic if we try!
		if (t == "bool" || t=="bool?" || t == "int" || t == "int?" || t == "double" || t == "double?") {
			suggest_type(this.base,"dynamic",true);
		}
		
		if (this.key==null) {
			console.log("wegottaproblemhere")
			return null;
		}

		if (this.base instanceof NodeClass) {
			var l = pipe_data.map_libs[this.base.c];
			//if (this.base.c=="Game" && this.)
			if (l) {
				//if (l[this.key])
				//	throw "heyo "+l[this.key];

				

				var lib_func = l[this.key];

				if (lib_func!=null && lib_func.var_hint) {
					return {varData: lib_func, var_wrapper: true}
				}

				return lib_func;
			}
			return;
		}



		if (this.key[0]=="/") {
			//console.log(this.key);
			var splitz = this.key.split(/\/proc\/|\/verb\//);
			if (splitz.length!=2) {
				throw "yo... "+this.key;
			}
			var classz = pipe_data.classes[splitz[0]];
			var funcz = classz.methods[splitz[0]+"/"+splitz[1]] || classz.methods[splitz[0]+"/proc/"+splitz[1]] || classz.verbs[splitz[0]+"/"+splitz[1]] || classz.verbs[splitz[0]+"/verb/"+splitz[1]];

			suggest_type(this.base,classz.name,true,true);

			return funcz;
		} else if (c) {
			if (this.key[0]=="$") {
				if (c.v_names[this.key]) {
					return c.v_names[this.key];
				}
			} else {
				while (c != null) {
					if (c.vars[this.key]) {
						return {varData: c.vars[this.key],var_wrapper: true}
					}
					c = c.parent;
				}
			}
		} else if (this.key[0] == "$") {
			// LAST DITCH EFFORT AT FINDING A MATCHING METHOD NAME!
			c = pipe_data.g_v_name_map[this.key];
			if (c) {
				suggest_type(this.base,c.name,true,true);

				return c.v_names[this.key];
			}
		} else {
			c = pipe_data.g_var_name_map[this.key];
			if (c) {
				suggest_type(this.base,c.name,true,true);

				return {varData: c.vars[this.key],var_wrapper: true};
			}
		}
	}
/*
	function NodeIndexMethod(b,k) {
		this.base = b;
		this.key = k;
	}

	NodeIndexMethod.prototype.expand = function() {
		
		return expand_node(this.base)+"."+this.key;
	}

	NodeIndexMethod.prototype.type = function() {
		var t = name_lib.get_type(this.base); //meh
		return null;
	}
*/
	function NodeList(d) {
		this.data = d;
	}

	function NodeIndexList(b,k,e) {
		this.base = b;
		this.key = k;
		this.is_save = e;
	}

	NodeIndexList.prototype.expand = function() {
		//var t = name_lib.get_type(this.base);
		
		return expand_node(this.base)+"["+expand_node(this.key)+"]";
	}

	NodeIndexList.prototype.type = function() {
		var t = name_lib.get_type(this.base); //meh

		if (t != "ByTable" && t != "SaveFile" && t != null)
			suggest_type(this.base,"dynamic",true);
		//return "dynamic"; // this is totally wrong but is the safest thing to do for now
	}





	NodeList.prototype.type = function() {
		// Let type inference do it's job
		if (this.data instanceof Map) {
			this.data.forEach(function(v,k) {
				name_lib.get_type(k);
				name_lib.get_type(v);
			});
		} else if (this.data instanceof Array) {
			this.data.forEach(function(v) {
				name_lib.get_type(v);
			});
		} else {
			name_lib.get_type(this.data);
		}

		return "ByTable"
	}

	var MAX_NODELIST_LEN = 200; //retry with multiline mode if text is longer than this.

	NodeList.prototype.expand = function(tabs,multiline_flag) {
		multiline_flag = multiline_flag=="MULTILINE_FLAG";

		var line_end = multiline_flag?"\n"+"\t".repeat(tabs+1):"";
		var line_end_final = multiline_flag?"\n"+"\t".repeat(tabs):"";

		if (this.data instanceof Map) {
			var txt = "new ByTable()";
			var first = true;
			var list_init_stack = [];
			this.data.forEach(function(v,k) {
				list_init_stack.push([k,v]);
			});
			list_init_stack.reverse();
			list_init_stack.forEach(function(kv) {
				txt+=line_end+".Set( "+expand_node(kv[0],tabs+1)+", "+expand_node(kv[1],tabs+1)+" )";
				/*if (first) {
					first=false;
				}
				else
					txt+=","+line_end;*/
				//txt+="["+expand_node(k)+"]= "+expand_node(v,tabs+1);
			});
			if (!multiline_flag && (txt+line_end_final).length>MAX_NODELIST_LEN)
				return this.expand(tabs,"MULTILINE_FLAG");
			return txt+line_end_final;
		} else if (this.data instanceof Array) {
			if (this.data.length==0)
				return "new ByTable()";
			var txt = "new ByTable(new object [] { "+line_end;
			var first = true;
			this.data.forEach(function(v) {
				if (first) {
					first=false;
				}
				else
					txt+=", "+line_end;
				txt+=expand_node(v,tabs+1);
			});
			if (!multiline_flag && (txt+line_end_final+" })").length>MAX_NODELIST_LEN)
				return this.expand(tabs,"MULTILINE_FLAG");
			return txt+line_end_final+" })";
		} else {
			return "new ByTable( "+expand_node(this.data)+" )";
		}
	}

	function decomp_func(f,block_tabs,prune_returns) {
		//var last_base = null;
		var closure_level = 0;
		var loop_ctrl_n = 1;
		var hole_n = 0;

		function new_hole() {
			var d = hole_n++;
			var t = "";
			do {
				t=String.fromCharCode(97+d%26)+t;
				d=Math.floor(d/26);
			} while (d>0);
			return "_"+t;
		}

		//if (f.path=="/obj/structure/table/proc/del_reqs")
		//	console.log("=======>",f.code[90],f.code[171],f.code[264]);

		function spawn_rewrite_jumps(list,start_i,end_i) {
			for (var i=0;i<list.length;i++) {
				var node = list[i];
				if (node instanceof NodeIfElse) {
					changed = spawn_rewrite_jumps(node.list_true,start_i,end_i);
					changed = spawn_rewrite_jumps(node.list_false,start_i,end_i);
				} else if (node instanceof NodeSwitch) {
					node.data.forEach(function(ns) {
						spawn_rewrite_jumps(ns[2],start_i,end_i);
					});
				} else if (node instanceof NodeGoto) {
					if (node.target<start_i || node.target>end_i) {
						list[i] = new NodeReturn(null,"Warning: Was a jump out of the closure!");
						list[i].addr = node.addr;
					}
				}
			}
		}

		//once a loop has been detected, we must re-write as many gotos to breaks and continues as possible.
		function loop_rewrite_jumps(list,start_i,end_i,penult) {
			loop_rewrite_jumps_r(list,start_i,end_i,penult,false);
		}

		function loop_rewrite_jumps_r(list,start_i,end_i,penult,should_do_ctrl) {
			var changed = false;
			var allow_next_end_i = f.code[end_i][0]=="list" && f.code[end_i][1]=="for_nested_end";

			for (var i=0;i<list.length;i++) {
				var node = list[i];
				if (node instanceof NodeIfElse) {
					changed = loop_rewrite_jumps_r(node.list_true,start_i,end_i,penult,should_do_ctrl) || changed;
					changed = loop_rewrite_jumps_r(node.list_false,start_i,end_i,penult,should_do_ctrl) || changed;
				} else if (node instanceof NodeTryCatch) {
					changed = loop_rewrite_jumps_r(node.list_try,start_i,end_i,penult,should_do_ctrl) || changed;
					changed = loop_rewrite_jumps_r(node.list_catch,start_i,end_i,penult,should_do_ctrl) || changed;
				} else if (node instanceof NodeSwitch) {
					node.data.forEach(function(ns) {
						changed = loop_rewrite_jumps_r(ns[2],start_i,end_i,penult,should_do_ctrl) || changed;
						//console.log("----------------------------->",b);
					});


				} else if (node instanceof NodeDoWhile || node instanceof NodeForEach || node instanceof NodeWhile) {
					var inner_loop_changed = loop_rewrite_jumps_r(node.list_body,start_i,end_i,penult,true);
					changed = inner_loop_changed || changed;

					if (inner_loop_changed) {
						if (!should_do_ctrl) { //root level!
							list.splice(i,0,["raw","string _loop_ctrl_"+loop_ctrl_n+" = null"]);
							list.splice(i+2,0,
								new NodeIfElse(new NodeBinary(new NodeHole("_loop_ctrl_"+loop_ctrl_n),"==","break"),[new NodeBreak()],[ 
									new NodeIfElse(new NodeBinary(new NodeHole("_loop_ctrl_"+loop_ctrl_n),"==","continue"),[new NodeContinue()],[])
								])
							);
							loop_ctrl_n++;
						} else {
							throw "sketch!";
						}
					}

				} else if (node instanceof NodeGoto) {
					if (node.target==start_i) {
						list[i] = new NodeContinue(should_do_ctrl && loop_ctrl_n);
						list[i].addr = node.addr;
						changed= true;
					} else if (node.target==end_i || (allow_next_end_i&& node.target==end_i+1)) {
						list[i] = new NodeBreak(should_do_ctrl && loop_ctrl_n);
						list[i].addr = node.addr;
						changed= true;
					} else if (penult !== true && (node.target==penult.addr || node.target==penult.addr2)) { //this is the hackiest hack ever and i do not reccomend you follow my example
						list[i] = new NodeContinue(should_do_ctrl && loop_ctrl_n);
						list[i].addr = node.addr;
						list.splice(i,0,penult);
						changed= true;
					} else if (node.target==90 || node.target == 171 || node.target == 264) { // this was some kind of debug trash
						//console.log(f.path,node.target,start_i,end_i,f.code[node.target],f.code[end_i]);
					}
					//console.log("-->goto",node.target,start_i,end_i);
				}
			}

			return changed;
		}

		//returns penult node or true on success - this is used for for loop continue hack!
		function loop_rewrite(list,start_i,end_i) {
			var last_node = list[list.length-1];

			if (last_node instanceof NodeGoto && last_node.target==start_i) {
				list.pop();

				return list[list.length-1] || true;
			}

			if (last_node instanceof NodeIfElse) {
				var ret = loop_rewrite(last_node.list_false,start_i,end_i);

				if (ret) {
					last_node.list_true.push(new NodeGoto(end_i));
					
					list.concat(last_node.list_false);

					Array.prototype.push.apply(list,last_node.list_false);
					last_node.list_false=[];
					
					return ret;
				}
			}
		}

		//returns NodeGotoTrue or null
		/*function loop_rewrite_do_while(list,end_i) {
			var last_node = list[list.length-1];
			if (last_node instanceof NodeGotoTrue) {
				return list.pop(); //don't search here - if a node was generate it already failed to find a target in it's own list
			}

			if (last_node instanceof NodeIfElse) {
				var ret = loop_rewrite_do_while(last_node.list_false,end_i);

				if (ret) {
					last_node.list_true.push(new NodeGoto(end_i));

					list.concat(last_node.list_false);

					var base_j = list.length-1;

					var fixed=false;

					for (var j=base_j;j>=0;j--) {
						if (list[j].addr==target_addr) {
							var do_while_node = new NodeDoWhile(cond,list.slice(j));
							list.splice(j,1/0);
							add_node(do_while_node);
							fixed=true;
							break;
						}
					}
				}
			}
		}*/
	/*
		function bit_call(f_name,lhs,rhs) {
			return new NodeCall(new NodeIndex(new NodeGlobalVar("bit"),f_name),rhs!=null?[lhs,rhs]:[lhs]);
		}
	*/
		

		var i = 0;
		function smart_decompile(halt_i,last_base) {
			//console.log("\n--->\n");
			var nodes = [];
			var stack = [];
			var cond = null;

			var trails = new Map();

			function fetch_oper(o) {
				switch (o[0]) {
					case "arg":
						if (f.uses_arglist)
							return new NodeIndexList(new NodeHole("_args"),o[1]+1);
						var that_dirty_arg = new NodeLocalVar(f.args[o[1]]);
						that_dirty_arg.argument_hint = true;
						return that_dirty_arg;
					case "args":
						return new NodeHole("_args");
					case "local":
						return new NodeLocalVar(f.vars[o[1]]);
					case "global":
						return new NodeGlobalVar(pipe_data.global_vars[o[1]]);
					case "world":
						return new NodeClass("Game13");
					case "member":
						var base = fetch_oper(o[1]);

						//last_base = base;

						o[2].forEach(function(key) {
							last_base = base;
							base = new NodeIndex(base,key);
/*
							if (key[0]=="/") {
								var splitz = key.split(/\/proc\/|\/verb\//);
								var classz = pipe_data.classes[splitz[0]];
								var funcz = classz.methods[splitz[0]+"/"+splitz[1]] || classz.methods[splitz[0]+"/proc/"+splitz[1]] || classz.verbs[splitz[0]+"/"+splitz[1]] || classz.verbs[splitz[0]+"/verb/"+splitz[1]];
								base = new NodeIndex(base,funcz.varData.name);
							} else if (key[0]=="%") {
								base = new NodeCall(new NodeIndex(new NodeClass("Misc13"),"get_verb"),[base,key.substring(1)]);
							} else if (key[0]=="$") {
								if (vnames[key]==null)
									console.log("CASH ~~>",key);
									//base = new NodeIndex(base,"$$"+key);
								base = new NodeIndex(base,vnames[key]);
							} else
								base = new NodeIndex(base,name_index(key));*/
						});

						return base;
					case "member_prev":
						var key = o[1];
						
						return new NodeIndex(last_base,key);

						/*if (key[0]=="/") {
							var splitz = key.split(/\/proc\/|\/verb\//);
							var classz = pipe_data.classes[splitz[0]];
							var funcz = classz.methods[splitz[0]+"/"+splitz[1]] || classz.methods[splitz[0]+"/proc/"+splitz[1]] || classz.verbs[splitz[0]+"/"+splitz[1]] || classz.verbs[splitz[0]+"/verb/"+splitz[1]];
							return new NodeIndex(last_base,funcz.varData.name);
						} else
							return new NodeIndex(last_base,name_index(key));*/


						//if (key[0]=="/")
						//	console.log("]]]]"+key);
						//console.log(f.name,">",last_base);
						//return new NodeIndex(last_base,o[1]);//  NodeIndex(last_base[1],o[1]);
					case "full_prev":
						return last_base;
					//case "goofy":
					//	return new NodeCall(new NodeIndex(new NodeGlobalVar("txt"),"last"),[]);
					case "src":
						if (f.type=="global")
							return new NodeIndex(new NodeClass("Task13"),"Source");
						if (f.is_world_func)
							return new NodeClass("Game13");
						if (f.type=="initializer" || f.type=="in_list")
							return new NodeThis(null,true);
						return new NodeThis(f.this_class.name);
					case "usr":
						return new NodeIndex(new NodeClass("Task13"),"User");
					case "null":
						return null;
					case "defret":
						//f.uses_defret = true;
						return new NodeDefault(f.varData);
					//case "last":
					//	return last_base;
					case "initial":
						var the_real_turdboy = fetch_oper(o[1]);

						if (the_real_turdboy instanceof NodeIndex)
							return new NodeCall(new NodeIndex(new NodeClass("Lang13"),"Initial"),[the_real_turdboy.base,the_real_turdboy.key]);
						else if (the_real_turdboy instanceof NodeIndexList) {
							if (the_real_turdboy.base instanceof NodeIndex && the_real_turdboy.base.key=="vars")
								return new NodeCall(new NodeIndex(new NodeClass("Lang13"),"Initial"),[the_real_turdboy.base.base,the_real_turdboy.key]);
						}

						return new NodeCall(new NodeIndex(new NodeClass("Lang13"),"InitialBroken"),[the_real_turdboy]);
					case "issaved":
						var the_real_turdboy = fetch_oper(o[1]);

						if (the_real_turdboy instanceof NodeIndex)
							return new NodeCall(new NodeIndex(new NodeClass("Lang13"),"IsSaved"),[the_real_turdboy.base,the_real_turdboy.key]);
						else if (the_real_turdboy instanceof NodeIndexList) {
							if (the_real_turdboy.base instanceof NodeIndex && the_real_turdboy.base.key=="vars")
								return new NodeCall(new NodeIndex(new NodeClass("Lang13"),"IsSaved"),[the_real_turdboy.base.base,the_real_turdboy.key]);
						}

						return new NodeCall(new NodeIndex(new NodeClass("Lang13"),"IsSavedBroken"),[the_real_turdboy]);
					case "pop":
						return stack.pop();
					default:
						throw "mows "+o;
				}
			}

			var node_start_i = null;
			var last_debug_i = null;

			function add_node(node) {
				//console.log("<add_node> "+node_start_i);
				node.addr = node_start_i;
				node.addr2 = last_debug_i;
				node_start_i = null;
				last_debug_i = null;
				nodes.push(node);
			}

			var for_to_range;

			loop:
			for (;i<halt_i;i++) {
				var ins = f.code[i];

				if (node_start_i==null)
					node_start_i=i;

				//console.log(i,ins);

				switch (ins[0]) {
					case "push":
						if (ins[1] instanceof Array) {
							stack.push(fetch_oper(ins[1]));
							//if (stack[stack.length-1]=="WHAT_THE_FUCKING_SHIT")
							//	console.log(">>>>>>>>>>>>>>>>>>>>>>>>",stack[stack.length-2]);
						} else if (ins[1]=="val") {
							stack.push(ins[2]);
						} else if (ins[1]=="cond") {
							stack.push(cond);
						}
						break;
					case "pop":
						if (ins[1]=="cond") {
							if (ins[2]=="alt") {// && f.type=="member" && f.varData.name=="Stat") {
								//console.log(">>",f.path);
								add_node(new NodeCall(new NodeIndex(new NodeClass("Interface13"),"Stat"),[stack.pop(),stack.pop()].reverse()));
							} else
								cond = stack.pop();
						} else if (ins[1]=="for_to") {
							for_to_range = [stack.pop(),stack.pop()].reverse();
						} else if (ins[1]=="for_to_step") {
							for_to_range = [stack.pop(),stack.pop(),stack.pop()].reverse();
						} else if (ins[1]==null) {
							var out = stack.pop();

							if (out==null) {
								// :D
							} else if (out instanceof NodeCall || out instanceof NodeListCall || out instanceof NodeTernary) {
								add_node(out);
							} else {
								throw "____"+JSON.stringify(out);
							}
						} else {
							throw "bad pop "+ins[1];
						}
						break;


					case "jmp":
						if (ins[1]=="false") {
							//use cond
							
							//if (f.name=="num2hex")
							//	console.log("if--->",expand_node(cond),i,ins[2]);
							
							i++;

							var branch_1 = smart_decompile(ins[2],last_base);

							//if (f.name=="build_click")
							//	console.log("TRUE<---",expand_node(cond));

							ins = f.code[i];
							var branch_2 = null;
							//if (f.name=="build_click")
							//	console.log("next_ins "+ins[0],i,halt_i);
							/*if (ins[0]=="jmp" && ins[1]=="fwd") {
								
								//i++; //only incr if we actually do something with it!

								if (f.name=="num2hex")
									console.log("else--->",expand_node(cond),i,halt_i,ins[2]);


								if (i>=halt_i-1) {
									//i++;

									//if (f.name=="num2hex")
									//	console.log("<----SHOULD BAIL----->");
									/*if (ins[2]>halt_i) {
										if (f.name=="num2hex")
											console.log("[====]")
										branch_1.nodes.push(new NodeGoto(ins[2]));* /
										//i++;
									//} else {
										//i--;
									//}
									//if (f.name=="build_click")
									//	console.log(">>>>>>>>>>>NO");
									//console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^vvvvvvvvvvvv>>>",i,halt_i,f.code[i]);
									//i--;
									//break;
									//branch_1.nodes.push(new NodeGoto(ins[2]));
									//i--; //please just fucking kill me
									//branch_1.nodes.push(new NodeGoto(ins[2]));
									//i++;
								} else if (ins[2]>halt_i) {
									i++;
									branch_1.nodes.push(new NodeGoto(ins[2]));
								} else {
									if (f.name=="num2hex")
										console.log("yes");

									i++;
									//i++;
									//if (f.name=="build_click")
									//	console.log("FALSE--->",expand_node(cond));
									
									branch_2 = smart_decompile(ins[2]);
									
									//if (f.name=="build_click")
									//	console.log("<---FALSE",expand_node(cond));
								}
								//console.log("------->",halt_i,ins[2])
							}*/

							if (branch_1.stack.length==1) {
								var tern_end_addr;
								try {
									tern_end_addr = branch_1.nodes.pop().target;
								} catch (e) {
									console.log(expand_node(branch_1.stack[0]));
									throw e;
								}
								//console.log("----->",tern_end_addr);
								branch_2 = smart_decompile(tern_end_addr,last_base);

								if (branch_2.stack.length!=1) {
									

								
									console.log("BADNESS "+f.path);
									console.log(expand_node(branch_1.stack[0]));
									console.log("<--------------->");
									console.log(expand_list(branch_1.nodes));
									console.log("<--------------->");
									console.log(expand_list(branch_2.nodes));

									throw "Bad ternary! "+branch_2.stack.length;
								}

								i--;
								stack.push(new NodeTernary(cond,branch_1.stack[0],branch_2.stack[0]));
								break;
							}


							//if (f.name=="num2hex")
							//	console.log("end--->",expand_node(cond));
				

							//if (branch_2==null) { // simple if
								if (branch_1.stack.length>0)
									throw "bad!! "+JSON.stringify(branch_1.stack);

								//var last = branch_1.nodes[branch_1.nodes.length-1];
								
								var penult = loop_rewrite(branch_1.nodes,node_start_i,i); 
								if (penult) {
									loop_rewrite_jumps(branch_1.nodes,node_start_i,i,penult);
									add_node(new NodeWhile(cond,branch_1.nodes));
								} else {
									var the_new_final = branch_1.nodes[branch_1.nodes.length-1];
									var the_new_if = new NodeIfElse(cond,branch_1.nodes,[]);
									if (last_base==null)
										last_base = branch_1.last_base;

									if (the_new_final instanceof NodeGoto) {
										the_new_if.trail = the_new_final.target;
										if (trails.has(the_new_final.target))
											trails.get(the_new_final.target).push(the_new_if);
										else
											trails.set(the_new_final.target,[the_new_if]);
									}

									add_node(the_new_if);
								}
							//}
							/*} else { // if/else
								//if (branch_1.stack.length!=branch_2.stack.length || branch_1.stack.length>1)
								//	throw "super bad!";

								if (branch_1.stack.length==1 && branch_2.stack.length==1) {
									stack.push(new NodeTernary(cond,branch_1.stack[0],branch_2.stack[0]));
									
									//stack.push(new NodeBinary(new NodeBinary(cond,"&&",branch_1.stack[0]),"||",branch_2.stack[0]));

									//branch_1.stack[0]
									//branch_2.stack[0]
									//console.log("---------->",branch_1.stack,branch_2.stack);
									//throw "ternary!";
								} else {
									if (branch_2.nodes[branch_2.nodes.length-1] instanceof NodeGotoTrue) { //detect if we need to re-write a do-while loop!
										//console.log("triggered!");
										var ngt = branch_2.nodes.pop();
										
										//fix branch 1
										branch_1.nodes.push(new NodeGoto(ngt.addr+1));
										
										add_node(new NodeIfElse(cond,branch_1.nodes,[]));

										//save current last node
										var base_j = nodes.length-1;

										//push branch 2
										Array.prototype.push.apply(nodes,branch_2.nodes);

										var target_addr = ngt.target;

										var fixed=false;

										console.log("---------->");
										for (var j=base_j;j>=0;j--) {
											console.log("."+j);
											if (nodes[j].addr==target_addr||nodes[j].addr2==target_addr) {
												var do_while_node = new NodeDoWhile(ngt.cond,nodes.slice(j));
												loop_rewrite_jumps(do_while_node.list_body,target_addr,ngt.addr+1,true);
												nodes.splice(j,1/0);
												nodes.push(do_while_node); //add_node not really appropriate here!
												fixed=true;
												break;
											}
										}

										if (!fixed)
											nodes.push(ngt);
									} else {
										add_node(new NodeIfElse(cond,branch_1.nodes,branch_2.nodes));
									}
								}*/
							//}
							i--;
						} else if (ins[1]=="true") {
							var target_addr = ins[2];

							var fixed=false;

							for (var j=nodes.length-1;j>=0;j--) {
								if (nodes[j].addr==target_addr || nodes[j].addr2==target_addr) {
									var do_while_node = new NodeDoWhile(cond,nodes.slice(j));
									loop_rewrite_jumps(do_while_node.list_body,target_addr,i+1,true);
									nodes.splice(j,1/0);
									nodes.push(do_while_node); //add_node not really appropriate here!
									fixed=true;
									break;
								}
							}

							if (!fixed) {
								add_node(new NodeGotoTrue(cond,target_addr));
							}
						} else if (ins[1]=="fwd") {
							//if (f.name=="blood_incompatible")
							//	console.log(">>>>>>>>>>>")
							//if (f.name=="build_click")
							//	console.log(">>>>>>>>>>>FWD");
						
							/*if (bail_on_fwd_jmp && i==halt_i-1) {
								if (f.name=="num2hex")
									console.log("[BREAK] ",i,ins[2]);
								

								//if (f.name=="build_click")
								//	console.log("BAIL!");
								//if (f.name=="blood_incompatible")
								//	console.log("bail!");
								//if (f.code[i+1][0]!="jmp" || f.code[i+1][1]!="fwd")
									break loop;
							}*/

							//if (i==ins[2])
							//	console.log("~~~~~~~~~")
							//if (f.name=="num2hex")
							//	console.log("goto",ins[2],i);
							//if (i!=ins[2])
							add_node(new NodeGoto(ins[2]));
						} else if (ins[1]=="goto") {
							add_node(new NodeGoto(ins[2]));
						} else if (ins[1]=="false2") {
							add_node(new NodeIfElse(new NodeUnary("!",cond),[new NodeGoto(ins[2])],[]));
						} else if (ins[1]=="spawn") {
							i++;
							var spawn_start_i = i;
							closure_level++;
							var spawn_list = smart_decompile(ins[2],last_base).nodes;
							closure_level--;
							add_node(new NodeSpawn(stack.pop(), spawn_list));
							i--;
							var spawn_end_i = i;
							spawn_rewrite_jumps(spawn_list,spawn_start_i,spawn_end_i);
						} else if (ins[1]=="for_to_fwd" || ins[1]=="for_to_step_fwd") {
							var for_start = i;
							var for_end = ins[2];

							i++;
							var bdy = smart_decompile(for_end,last_base).nodes;
							i--;

							//console.log(bdy);
							//add_node(new NodeForEach()

							if (!loop_rewrite(bdy,for_start,for_end)) {// (foreach_final instanceof NodeGoto) || foreach_final.target!=foreach_start) {
								throw "bad for-to"
							}

							loop_rewrite_jumps(bdy,for_start,for_end,true);

							var hole_txt = new_hole();

							var my_fukkin_var = fetch_oper(ins[3]);

							bdy.unshift(null);
							bdy.unshift(new NodeBinary(my_fukkin_var,"=",new NodeHole(hole_txt,"double")));


							var cur_last_node = nodes[nodes.length-1];
							if (cur_last_node instanceof NodeBinary && cur_last_node.op=="=" && cur_last_node.left instanceof NodeLocalVar && cur_last_node.left._var == my_fukkin_var._var) {
								nodes.pop();
							}

							add_node(new NodeForEach(new NodeCall(new NodeIndex(new NodeClass("Lang13"),"IterateRange"),for_to_range),bdy,hole_txt));

							//throw "-> "+for_to_range
						} else if (ins[1]=="for_to_back") { // NOT A REAL JUMP! TOTALLY BOGUS!
							//add_node(new NodeGoto(ins[2]));
						} else if (ins[1]=="&&") {
							i++;
							var arg_2 = smart_decompile(ins[2],last_base).stack;
							i--;

							if (arg_2.length!=1)
								throw "bad logic1";
							
							stack.push(new NodeBinary(stack.pop(),"&&",arg_2[0]));
						} else if (ins[1]=="||") {
							i++;
							var arg_2 = smart_decompile(ins[2],last_base).stack;
							i--;

							if (arg_2.length!=1)
								throw "bad logic2";
							
							stack.push(new NodeBinary(stack.pop(),"||",arg_2[0]));
						} else {
							throw "unknown jump "+ins[1];
						}
						break;
					case "switch":
						

						var switch_data = ins[1];
						var last_addr = -1;
						var addr_list = [];
						var i_case=0;


						if (switch_data.ranges) {
							var i_range=0;
							while (i_case<switch_data.cases.length && i_range<switch_data.ranges.length) {
								if (switch_data.cases[i_case][1]<switch_data.ranges[i_range][2]) {
									if (switch_data.cases[i_case][1]>last_addr) {
										last_addr = switch_data.cases[i_case][1];
										addr_list.push(last_addr);
									}
									i_case++;
								} else {
									if (switch_data.ranges[i_range][2]>last_addr) {
										last_addr = switch_data.ranges[i_range][2];
										addr_list.push(last_addr);
									}
									i_range++;
								}
							}

							while (i_range<switch_data.ranges.length) {
								if (switch_data.ranges[i_range][2]>last_addr) {
									last_addr = switch_data.ranges[i_range][2];
									addr_list.push(last_addr);
								}
								i_range++;
							}
						}

						while (i_case<switch_data.cases.length) {
							if (switch_data.cases[i_case][1]>last_addr) {
								last_addr = switch_data.cases[i_case][1];
								addr_list.push(last_addr);
							}
							i_case++;
						}

						if (switch_data.def>last_addr) {
							addr_list.push(switch_data.def);
						}
						
						var switch_node_lists = {};
						i++;
						for (var i_n=0;i_n<addr_list.length-1;i_n++) {
							if (i!=addr_list[i_n])
								throw "bad switch";
							switch_node_lists[addr_list[i_n]] = smart_decompile(addr_list[i_n+1],last_base).nodes;
						}

						var final_start = addr_list[addr_list.length-1];

						var final_end = null;
						for (k in switch_node_lists) {
							var last_goto = switch_node_lists[k].pop();
							if (!(last_goto instanceof NodeGoto)) {
								console.log(expand_node(last_goto,1));
								throw "more bad switch "+JSON.stringify(stack.pop());//+" - "+expand_node(last_goto);
							}

							if (final_end==null) {
								final_end=last_goto.target;
							} else if (final_end!=last_goto.target) {
								throw "very bad switch"
							}

							//pop out gotos to end
						}

						//console.log(final_start,final_end);

						if (final_start!=final_end) {
							if (i!=final_start)
								throw "i dont even know anymore";
							switch_node_lists[final_start] = smart_decompile(final_end,last_base).nodes;
						}

						var out_data = [];

						if (switch_data.ranges) {
							var i_range=0;

							while (i_range<switch_data.ranges.length) {
								var cur_addr = null;

								var ranges = [];

								while (i_range<switch_data.ranges.length && (cur_addr==null || cur_addr==switch_data.ranges[i_range][2])) {
									if (cur_addr==null)
										cur_addr= switch_data.ranges[i_range][2];

									ranges.push([switch_data.ranges[i_range][0],switch_data.ranges[i_range][1]]);

									i_range++;
								}

								out_data.push(["ranges",ranges.reverse(),switch_node_lists[cur_addr]]);
							}
						}

						var i_case = 0;

						while (i_case<switch_data.cases.length) {
							var cur_addr = null;

							var cases = [];

							while (i_case<switch_data.cases.length && (cur_addr==null || cur_addr==switch_data.cases[i_case][1])) {
								if (cur_addr==null)
									cur_addr= switch_data.cases[i_case][1];

								cases.push(switch_data.cases[i_case][0]);

								i_case++;
							}

							out_data.push(["cases",cases.reverse(),switch_node_lists[cur_addr]]);
						}

						if (switch_node_lists[switch_data.def]) {
							out_data.push(["default",[],switch_node_lists[switch_data.def]]);
						}

						i--;
						add_node(new NodeSwitch(stack.pop(),out_data,new_hole()));

						break;
					case "pick":
						var pick_dynamic = (ins[1]=="dynamic");

						var switch_data = ins[2];
						var out_data = [];
						var sw_final_addr = null;
						i++;

						var pick_dynamic_buffer = [];
						if (pick_dynamic) {
							for (var is=0;is<switch_data.cases.length+1;is++) {
								//console.log("--------------------------------------------------------+");
								pick_dynamic_buffer.push(stack.pop());
							}
						}

						for (var is=0;is<switch_data.cases.length-1;is++) {
							var sw_num = pick_dynamic?pick_dynamic_buffer.pop():switch_data.cases[is][0];

							var sw_addr_start = switch_data.cases[is][1];
							var sw_addr_stop = switch_data.cases[is+1][1];

							if (i!=sw_addr_start) {
								//console.log(i,sw_addr_start);
								throw "ah shit";
							}
							var swdc = smart_decompile(sw_addr_stop,last_base);
							out_data.push({n: sw_num, value: swdc.stack.pop()});
							//final_addrs = swdc.nodes.pop();
							
							var sw_final = swdc.nodes.pop();
							if (!(sw_final instanceof NodeGoto))
								throw "very bad pick!";

							if (sw_final_addr === null)
								sw_final_addr = sw_final.target;
							else if (sw_final_addr != sw_final.target)
								throw "very very bad pick!";
							//console.log(swdc.nodes.pop());
						}
						
						//PENULT

						var sw_num = pick_dynamic?pick_dynamic_buffer.pop():switch_data.cases[switch_data.cases.length-1][0];

						var sw_addr_start = switch_data.cases[switch_data.cases.length-1][1];
						var sw_addr_stop = switch_data.def;

						if (i!=sw_addr_start)
							throw "very bad pick 3";

						var swdc = smart_decompile(sw_addr_stop,last_base);
						out_data.push({n: sw_num, value: swdc.stack.pop()});

						var sw_final = swdc.nodes.pop();
						if (!(sw_final instanceof NodeGoto))
							throw "very bad pick!";

						if (sw_final_addr === null)
							sw_final_addr = sw_final.target;
						else if (sw_final_addr != sw_final.target)
							throw "very very bad pick!";

						//ULT

						var sw_addr_start = switch_data.def;
						var sw_addr_stop = sw_final_addr;

						out_data.push({n: null, value: smart_decompile(sw_addr_stop,last_base).stack.pop()});

						//FINISH

						stack.push(new NodePick(out_data,pick_dynamic));
						//stack.push(new NodeLocalVar("_"));
						i--;

						break;
					case "asn":
						if (ins[1]=="=") {
							//goofy, goofy fucking special cases...
							if (ins[2][0]=="list_index") {
								var guhubba = stack.pop();
								stack.push(new NodeIndexList(stack.pop(),guhubba));
								break;
							}
							//console.log(ins[2][0]);
							//if (ins[2]=="")
						}

						var lhs;
						if (ins[2][0]=="pop")
							lhs=stack.pop();
						else
							lhs = fetch_oper(ins[2]);

						var rhs;

						if (ins[1]=="++") {
							add_node(new NodeUnary("++",lhs,true));
							break;
						} else if (ins[1]=="--") {
							add_node(new NodeUnary("--",lhs,true));
							break;
						} else if (ins[1]=="++pre") {
							stack.push(new NodeUnary("++",lhs));
							break;
						} else if (ins[1]=="--pre") {
							stack.push(new NodeUnary("--",lhs));
							break;
						} else if (ins[1]=="++post") {
							stack.push(new NodeUnary("++",lhs,true));
							break;
						} else if (ins[1]=="--post") {
							stack.push(new NodeUnary("--",lhs,true));
							break;
						} else {
							rhs = stack.pop();

							if (ins[1]=="=") {




								//do nothing

							/*} else if (ins[1]=="+=") {
								rhs = new NodeBinary(lhs,"+",rhs);
							} else if (ins[1]=="-=") {
								rhs = new NodeBinary(lhs,"-",rhs);
							} else if (ins[1]=="*=") {
								rhs = new NodeBinary(lhs,"*",rhs);
							} else if (ins[1]=="/=") {
								rhs = new NodeBinary(lhs,"/",rhs);
							} else if (ins[1]=="%=") {
								rhs = new NodeBinary(lhs,"%",rhs);
	*/
						//	} else
/*
							} else if (ins[1]=="&=") {
								rhs = new NodeBinary(lhs,"&",rhs);
							} else if (ins[1]=="|=") {
								rhs = new NodeBinary(lhs,"|",rhs);
							} else if (ins[1]=="^=") {
								rhs = new NodeBinary(lhs,"^",rhs);
							} else if (ins[1]=="<<=") {
								rhs = new NodeBinary(lhs,"<<",rhs);
							} else if (ins[1]==">>=") {
								rhs = new NodeBinary(lhs,">>",rhs);
*/
							} else {
								add_node(new NodeBinary(lhs,ins[1],rhs));
								break;
							}
						}

						add_node(new NodeBinary(lhs,"=",rhs));

						break;
					case "bi":
						var op = ins[1];
						var rhs = stack.pop();

						/*if (op=="&") {
							stack.push(bit_call("band",stack.pop(),rhs));
						} else if (op=="|") {
							stack.push(bit_call("bor",stack.pop(),rhs));
						} else if (op=="^") {
							stack.push(bit_call("bxor",stack.pop(),rhs));
						} else if (op=="<<") {
							stack.push(bit_call("lshift",stack.pop(),rhs));
						} else if (op==">>") {
							stack.push(bit_call("rshift",stack.pop(),rhs));
						} else {*/
						if (op=="**") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Math"),"Pow"),[stack.pop(),rhs]));
						} else {
							stack.push(new NodeBinary(stack.pop(),op,rhs));
						}
						break;
					case "un":
						var op = ins[1];

						//if (op=="~") {
						//	stack.push(bit_call("bnot",stack.pop()));
						//} else {
							stack.push(new NodeUnary(op,stack.pop()));
						//}
						break;
					case "cmp":
						var op = ins[1];
						var rhs = stack.pop();
						if (op=="==") { //sets cond and pushes garbage--todo
							cond = new NodeBinary(stack.pop(),op,rhs);
							stack.push(null);
						} else {			
							stack.push(new NodeBinary(stack.pop(),op,rhs));
						}
					
						break;
					case "call":
						var f_=null;

						if (ins[1]=="new_list") {
							var arg_tbl = stack.pop(); // args

							f_ = stack.pop();
							if (typeof(f_) == "string") {
								f_ = new NodeClass(pipe_data.classes[f_].name);
							}

							

							//console.log("LIST CALL CTOR!!!",f_);
							stack.push(new NodeListCall(f_,arg_tbl));
							//stack.push(new NodeCall(new NodeIndex(f_,"BTNew"),[arg_tbl]));
							break;
						}

						var args = [];
						var list_call = false;
						if (ins[1]=="member"&&ins[3]==65535) {
							args.push(stack.pop());
							list_call = true;
						} else if (ins[1]=="list" || ins[1]=="super_list" || ins[1]=="getf2_list" || ins[1]=="getf_list") {
							args.push(stack.pop());
							list_call = true;
						} else {
							for (var jj=0;jj<ins[3];jj++) {
								args.push(stack.pop());
							}
						}

						var _EXTEND_ARGS_=false;

						if (ins[1]=="global" || ins[1]=="list") {
							f_ = new NodeGlobalFunc(pipe_data.global_funcs[ins[2]]);
						} else if (ins[1]=="member") {
							f_ = fetch_oper(ins[2]);
							//console.log(ins[2][1]);
							//throw "->"
							//console.log(ins[2][1]);
							//console.log(">")
							//if (ins[2][0]=="member")
							//last_base = fetch_oper(ins[2][1]);
							//console.log("<")
							//console.log(last_base);
						} else if (ins[1]=="this") {
							if (f.type=="global") {
								f_ = new NodeGlobalFunc(f);
							} else if (f.type=="member") {
								f_ = new NodeIndex(new NodeThis(f.this_class.name),"$"+f.verb_name);
							//} else if (f.type=="initializer") {
							//	f_ = new NodeIndex(new NodeThis(),"$"+f.verb_name);
							} else {
								throw "invalid THISCALL";
							}
						} else if (ins[1]=="super" || ins[1]=="super_list") {
							if (f.type=="global") {
								throw "what the unholy fuck?"
							} else {
								//console.log("su======================= ",f.this_class.parent) //pipe_data.map_classes[f.this_class].parent.name
								if (f.varData.name==null)
									f_ = new NodeSuper(f.this_class.parent);
								else if (f.is_world_func) {
									f_ = new NodeIndex(new NodeClass("Game13"),"$_internal_"+f.verb_name);
									_EXTEND_ARGS_=true;
								}
								else if (f.use_super_internal) {
									f_ = new NodeIndex(new NodeThis(f.this_class.name),"$_internal_"+f.verb_name);
									_EXTEND_ARGS_=true;
								}
								else {
									//f_ = "XYZZY"
									f_ = new NodeIndex(new NodeSuper(f.this_class.parent),"$"+f.verb_name);
									_EXTEND_ARGS_=true;
								}
							}
						} else if (ins[1]=="new") {
							f_ = stack.pop();
							if (typeof(f_) == "string") {
								var new_class = pipe_data.classes[f_];
								f_ = new NodeClass(new_class?new_class.name:f_);
								//console.log(f_);
							}
							if (f_ instanceof Array && f_[0]=="proc" && args.length==0) {
								stack.push(f_);
								break;
							}

						} else if (ins[1]=="direct") {
							f_ = stack.pop();

						} else if (ins[1]=="getf_list") {
							f_ = new NodeGlobalFunc(stack.pop(),true);
						} else if (ins[1]=="getf2" || ins[1]=="getf2_list") {
							f_ = new NodeCall( new NodeIndex(new NodeClass("Lang13"), "BindFunc"), [stack.pop(),stack.pop()].reverse());
						} else if (ins[1]=="getf_dll") {
							f_ = new NodeCall( new NodeIndex(new NodeClass("Lang13"), "GetLibFunc"), [stack.pop(),stack.pop()].reverse());
							//console.log(f_,args);
						} else
							throw "bad call "+ins[1];


						if (list_call) {
							//if (f_ instanceof NodeIndex) {
							//	f_ = new NodeCall(new NodeIndex(new NodeCall(new NodeIndex(f_.base,"GetType"),[]),"GetMethod"),[f_.key]);
							//	stack.push(new NodeCall(new NodeIndex(args[0],"_apply_"),[f_]));
							//}
							//else
							stack.push(new NodeListCall(f_,args[0]));
							//stack.push(new NodeCall(new NodeIndex(args[0],"$apply"),[f_]));
						}
						else if (_EXTEND_ARGS_) {
							args = args.reverse();
							for (var i_i_i=0;i_i_i<f.args.length;i_i_i++) {
								if (args[i_i_i]==null) {
									var new_arg = new NodeLocalVar(f.args[i_i_i]);
									new_arg.argument_hint = true;
									args.push(new_arg);
								}
							}
							stack.push(new NodeCall(f_,args));
						} else 
							stack.push(new NodeCall(f_,args.reverse()));
						

						break;
					case "return":
						if (ins[1]=="pop") {
							var brand_new_return = new NodeReturn(stack.pop(),null,(closure_level==0 && !f.is_ctor)?f.varData:null);
							if (closure_level>0)
								brand_new_return.use_leader = true;
							else
								brand_new_return.do_suggest = true;
							add_node(brand_new_return);
						}
						else {
							add_node(new NodeReturn((closure_level==0 && f.uses_defret)?new NodeDefault(f.varData):null,null,(closure_level==0  && !f.is_ctor)?f.varData:null));
						}
						break;
					case "list":
						if (ins[1]=="in") {
							//var aaaa = stack.pop();
							if (ins[2]=="to") {
								//cond = new NodeBinary(aaaa,"in",new NodeCall(new NodeGlobalVar("in_range"),[stack.pop()stack.pop(),stack.pop()].reverse()));
								var aaaa = stack.pop();
								cond = new NodeCall(new NodeIndex(new NodeClass("Lang13"),"is_in_range"),[stack.pop(),stack.pop(),aaaa].reverse())
							} else {
								var aaaa = stack.pop();
								//stack.push(new NodeBinary(stack.pop(),"in",stack.pop()));

								cond = new NodeCall(new NodeIndex(stack.pop(),"$Contains"),[aaaa]);
								//stack.push(new NodeBinary(aaaa,"in",stack.pop()));
							}
						} else if (ins[1]=="for_pop") { //todo types
							var foreach_list;

							if (ins[2]==5)
								foreach_list = stack.pop();
							else if (ins[2]==6)
								foreach_list = new NodeCall(new NodeIndex(new NodeClass("Map13"),"fetch_in_block"),[stack.pop(),stack.pop()].reverse());
							else if (ins[2]==7) 
								foreach_list = new NodeCall(new NodeIndex(new NodeClass("Map13"),"fetch_in_view"),[stack.pop(),stack.pop()]);
							else if (ins[2]==8)
								foreach_list = new NodeCall(new NodeIndex(new NodeClass("Map13"),"fetch_in_view_nocenter"),[stack.pop(),stack.pop()]);
							else
								throw "fuck everything+everyone "+ins[2];

							var for_each_type = ins[3];

							ins = f.code[++i];

							if (ins[0]!="list"||ins[1]!="for_push")
								throw "bad iter loop"

							var foreach_start = i;

							ins = f.code[++i];

							if (ins[0]!="asn"||ins[1]!="=")
								throw "bad iter loop 2"

							var foreach_var = fetch_oper(ins[2]);

							ins = f.code[++i];

							if (ins[0]!="jmp"||ins[1]!="false")
								throw "bad iter loop 3"

							var foreach_end = ins[2];

							i++;


							var foreach_nodes = smart_decompile(foreach_end,last_base).nodes;

							//var foreach_final = foreach_nodes.pop();

							if (!loop_rewrite(foreach_nodes,foreach_start,foreach_end)) {// (foreach_final instanceof NodeGoto) || foreach_final.target!=foreach_start) {
								throw "bad iter loop 4"
							}

							loop_rewrite_jumps(foreach_nodes,foreach_start,foreach_end,true);

							var hole_txt = new_hole();

							var first_node = foreach_nodes[0];

							var hole_type = null;
							
							if (first_node instanceof NodeIfElse) {
								if (first_node.cond instanceof NodeUnary) {
									if (first_node.cond.target instanceof NodeBinary) {
										if (first_node.cond.target.left instanceof NodeLocalVar && first_node.cond.target.left._var==foreach_var._var) {
											if (first_node.cond.target.op=="is") {
												//foreach_hole = new NodeBinary(foreach_hole,"as",first_node.cond.target.right);
												foreach_nodes.shift();
												if (first_node.cond.target.right instanceof Array) {
													if (first_node.cond.target.right[0]=="class") {
														hole_type = pipe_data.classes[first_node.cond.target.right[1]].name;
													} else if (first_node.cond.target.right[0]=="list_ctor") {
														hole_type = "ByTable";
													}
												}

												//console.log(">>",first_node.cond.target.right);
											}
										}
									}
								}
							}

							if (for_each_type != 0) {
								if (for_each_type==1)
									for_each_type="Mob";
								else if (for_each_type==2)
									for_each_type="Obj";
								else if (for_each_type==3)
									for_each_type="Ent_Dynamic";
								else if (for_each_type==32)
									for_each_type="Tile";
								else if (for_each_type==256)
									for_each_type="Zone";
								else if (for_each_type==291)
									for_each_type="Ent_Static";
								else if (for_each_type==16384) {
									foreach_type = name_lib.get_type(foreach_list);
									foreach_list = stack.pop();
									console.log("------------------------->")
								}

								if (typeof(for_each_type) == "string") {
									/*if (hole_type==null) {
										first_node = new NodeIfElse(new NodeUnary("!",new NodeBinary(foreach_var,"is",new NodeClass(for_each_type))),[ new NodeContinue() ],[])
										foreach_nodes.unshift(first_node);
									}*/

									for_each_type = null;
								}
							} else {
								for_each_type = null;
							}

							var foreach_hole = new NodeHole(hole_txt,hole_type);

							/*if (hole_type!=null) {
								first_node.cond.target.left = foreach_hole;
								foreach_nodes.splice(1,0,new NodeBinary(foreach_var,"=",foreach_hole));
							} else {*/

								//foreach_nodes.unshift(new NodeIfElse(new NodeBinary(foreach_var,"==",null),[new NodeContinue()],[]));
							
							foreach_nodes.unshift(null);

							foreach_nodes.unshift(new NodeBinary(foreach_var,"=",foreach_hole));
							//}
							

							if (hole_type!=null) {
								foreach_list = new NodeCall(new NodeIndex(new NodeClass("Lang13"),"Enumerate"),[foreach_list,new NodeClass(hole_type)]);
							} else {
								foreach_list = new NodeCall(new NodeIndex(new NodeClass("Lang13"),"Enumerate"),[foreach_list]);
							}

							var cur_last_node = nodes[nodes.length-1];
							if (cur_last_node instanceof NodeBinary && cur_last_node.op=="=" && cur_last_node.left instanceof NodeLocalVar && cur_last_node.left._var == foreach_var._var) {
								nodes.pop();
							}

							var new_node_foreach = new NodeForEach(foreach_list,foreach_nodes,hole_txt);

							new_node_foreach.typecode = for_each_type;

							add_node(new_node_foreach);

							//console.log(ins);
							//throw "uuuu"
							i--;
						} else if (ins[1]=="for_nested" || ins[1]=="for_nested_end") {
							//no-op
						} else if (ins[1]=="new") {
							var list_args = [];
							for (var ia = 0;ia<ins[2];ia++) {
								list_args.push(stack.pop());
							}
							stack.push(new NodeList(list_args.reverse()));
						} else if (ins[1]=="new_assoc") {
							var map_structure = new Map();
							for (var ia = 0;ia<ins[2];ia++) {
								var map_v = stack.pop();
								map_structure.set(stack.pop(),map_v);
							}
							stack.push(new NodeList(map_structure)); //todo
						} else if (ins[1]=="new_oflen") {
							stack.push(new NodeList(stack.pop()));
						} else if (ins[1]=="get") {
							var arg_2 = stack.pop();
							stack.push(new NodeIndexList(stack.pop(),arg_2));
						} else if (ins[1]=="set") {
							var arg_2 = stack.pop();
							add_node(new NodeBinary(new NodeIndexList(stack.pop(),arg_2),"=",stack.pop()));
						} else if (ins[1]=="goofy") {
							var arg_2 = stack.pop();
							stack.push(new NodeIndexList(stack.pop(),arg_2,true));
						} else {
							throw "leest "+ins[1];
						}
						break;
					case "sub":
						var sub_count = ins[3];

						var sub_stack = [];
						for (var iii=0;iii<sub_count;iii++) {
							sub_stack.push(stack.pop());
						}

						var sub_split = ins[2].split(/ÿ/);

						var sub_1st = sub_split.shift();

						var sub_is_simple = true;

						sub_split.forEach(function(ss) {
							var t = ss[0].charCodeAt(0);
							if (t!=1 && t!=2) {
								sub_is_simple = false;
							}
						});

						if (sub_is_simple) {
							var sub_concat_node = sub_1st;

							sub_split.forEach(function(ss) {
								sub_concat_node = new NodeBinary(sub_concat_node,"+",sub_stack.pop());

								if (ss.length>1)
									sub_concat_node = new NodeBinary(sub_concat_node,"+",ss.substring(1));
							});

							

						} else {

							var sub_concat_node = new NodeCall(new NodeClass("Txt"),sub_1st==""?[]:[sub_1st]);

							var sub_next_set = false;

							sub_split.forEach(function(ss) {
								var t = ss[0].charCodeAt(0);
								if (t==1) {
									sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$item"),[sub_stack.pop()]);
								} else if (t==2) {
									//sub_concat_node = new NodeBinary(sub_concat_node,"+",new NodeCall(new NodeIndex(new NodeGlobalVar("txt"),"target_fwd??"),[sub_stack.pop()])); //TARGET OF FOLLOWING MACROS?
									//throw "WTF";
									sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$item"),[sub_stack.pop()]); //is there going to be a goddamn issue here?
								} else if (t==3) {
									sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$item"),[]);
									sub_next_set = false;
								} else if (t==5) {
									sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$st_nd_rd"),[sub_stack.pop()]);
								} else if (t==6) {
									//if (!sub_next_set) {
										sub_next_set = true; //target fwd ADDS SPACE AFTER
										sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$a"),[sub_stack.pop()]);
									//} else {
									//	sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$a"),[]);
									//}
								} else if (t==7) {
									//if (!sub_next_set) {
										sub_next_set = true; //target fwd ADDS SPACE AFTER
										sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$A"),[sub_stack.pop()]);
									//} else {
									//	sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$A"),[]);
									//}
								} else if (t==8) {
									//if (!sub_next_set) {
										sub_next_set = true; //target fwd ADDS SPACE AFTER
										sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$the"),[sub_stack.pop()]);
									//} else {
									//	sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$the"),[]);
									//}
								} else if (t==9) {
									//if (!sub_next_set) {
										sub_next_set = true; //target fwd ADDS SPACE AFTER
										sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$The"),[sub_stack.pop()]);
									//} else {
									//	sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$The"),[]);
									//}
								} else if (t==10) {
									sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$he_she_it_they"),[]); //target back
								} else if (t==11) {
									sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$He_She_It_They"),[]); //target back
								} else if (t==12) {
									sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$his_her_its_their"),[]); //target back
								} else if (t==13) {
									sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$His_Her_Its_Their"),[]); //target back
								} else if (t==14) {
									sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$his_hers_its_theirs"),[]); //target back
								} else if (t==15) {
									sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$His_Hers_Its_Theirs"),[]); //target back
								} else if (t==16) {
									sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$him_her_it_them"),[]); //target back
								} else if (t==17) {
									sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$himself_herself_itself_themself"),[]); //target back
								} else if (t==18) {
									sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$no_newline"),[]);
								
								} else if (t==20) {
									sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$s"),[]); //target back
								} else if (t==21) {
									sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$proper"),[]);
								} else if (t==22) {
									sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$improper"),[]);
								
								} else if (t==31) {
									sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$red"),[]);
								} else if (t==32) {
									sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$green"),[]);
								} else if (t==33) {
									sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$blue"),[]);
								} else if (t==34) {
									sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$black"),[]);

								} else if (t==42) {
									sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$Ref"),[sub_stack.pop()]);
								} else if (t==43) {
									sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$icon"),[sub_stack.pop()]);
								} else if (t==44) {
									sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$roman"),[sub_stack.pop()]);
								} else if (t==45) {
									sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$Roman"),[sub_stack.pop()]);
								} else {
									throw "sub problem "+ins[2]+" "+t;
								}
								//sub_concat_node = new NodeBinary(sub_concat_node,"+","~"+ss[0].charCodeAt(0));
								if (ss.length>1)
										sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$str"),[ss.substring(1)]);;
								//console.log("%%%%>",ss);
							});
							sub_concat_node = new NodeCall(new NodeIndex(sub_concat_node,"$ToString"),[]);
						}

						if (ins[1]=="push")
							stack.push(sub_concat_node);
						else if (ins[1]=="write") {
							add_node(new NodeCall(new NodeIndex(stack.pop(),"$WriteMsg"),[sub_concat_node]));
						}

						break;
					case "io":
						if (ins[1]=="write") {
							var written = stack.pop();

							var write_target = stack.pop();

							if (write_target.is_save)
								add_node(new NodeBinary(write_target,"=",written));//          new NodeCall(new NodeIndex(stack.pop(),"$WriteMsg"),[written]));
							else
								add_node(new NodeCall(new NodeIndex(write_target,"$WriteMsg"),[written]));
						} else if (ins[1]=="read") {
							var read_target = stack.pop();
							if (read_target.is_save)
								stack.push(read_target);
							else
								stack.push(new NodeCall(new NodeIndex(read_target,"$Read"),[]));
						} else {
							throw "0"
						}
						break;
					case "ex":
						if (ins[1]=="try") {
							i++;
							var list_try = smart_decompile(ins[2]-1,last_base);

							ins = f.code[i];

							if (ins[0]!="ex" || ins[1]!="catch") {
								throw "bad try catch";
							}

							i++;
							var ex_var = null;

							var ins_ex = f.code[i];
							if (ins_ex[0]=="asn" && ins_ex[1]=="=") {
								ex_var = fetch_oper(ins_ex[2]);
								i++;
							} else if (ins_ex[0]=="pop" && ins_ex[1]==null) {
								// we gud
								i++;
							} else if (ins_ex[0]=="push" && ins_ex[1]=="val" && ins_ex[2]==null){
								i++;
								i++;
								ins_ex = f.code[i];
								if (ins_ex[0]=="asn" && ins_ex[1]=="=") {
									ex_var = fetch_oper(ins_ex[2]);
									i++;
								} else {
									throw "say wut"
								}
							} else {
								throw "badder try catch"+ins_ex[0];
							}

							var list_catch = smart_decompile(ins[2],last_base);
							i--;

							add_node(new NodeTryCatch(list_try.nodes,ex_var,list_catch.nodes));

							//throw "yes "+i;
						} else if (ins[1]=="catch") { //if we manage to run into one of these treat it as a goto...
							add_node(new NodeGoto(ins[2]));
						} else if (ins[1]=="throw") {
							add_node(new NodeThrow(stack.pop()));
						} else {
							throw "nope";
						}
						break;
					case "del":
						var del_prev_node = nodes.pop();
						
						add_node(new NodeCall(new NodeIndex(new NodeClass("Lang13"),"Delete"),[stack.pop()]));

						nodes.push(del_prev_node);
						break;
					case "std":
						
						// LANG -- GOOD
						if (ins[1]=="typesof") {
							var args = [];
							for (var jj=0;jj<ins[2];jj++) {
								args.push(stack.pop());
							}

							stack.push(new NodeCall(new NodeIndex(new NodeClass("Lang13"),"GetTypes"),args.reverse()));

						} else if (ins[1]=="istype") {
							var arg2 = stack.pop();
							if (arg2 instanceof Array && (arg2[0]=="class" || arg2[0]=="list_ctor"))
								stack.push(new NodeBinary(stack.pop(),"is",arg2));
							else
								stack.push(new NodeCall(new NodeIndex(arg2,"$IsInstanceOfType"),[stack.pop()]));
						} else if (ins[1]=="isnull") {
							stack.push(new NodeBinary(stack.pop(),"==",null));
						} else if (ins[1]=="isnum") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Lang13"),"$IsNumber"),[stack.pop()]));
						} else if (ins[1]=="istext") {
							stack.push(new NodeBinary(stack.pop(),"is",new NodeClass("string")));
						} else if (ins[1]=="isfile") {
							stack.push(new NodeBinary(stack.pop(),"is",new NodeClass("File")));
						} else if (ins[1]=="isloc") {
							cond = new NodeCall(new NodeIndex(new NodeClass("Lang13"),"$IsLocation"),[stack.pop()]);
						} else if (ins[1]=="isicon") {
							stack.push(new NodeBinary(stack.pop(),"is",new NodeClass("Icon")));
						} else if (ins[1]=="isarea") {
							cond = new NodeBinary(stack.pop(),"is",new NodeClass("Zone"));
						} else if (ins[1]=="isturf") {
							cond = new NodeBinary(stack.pop(),"is",new NodeClass("Tile"));
						} else if (ins[1]=="isobj") {
							cond = new NodeBinary(stack.pop(),"is",new NodeClass("Obj"));
						} else if (ins[1]=="ismob") {
							cond = new NodeBinary(stack.pop(),"is",new NodeClass("Mob"));
						} else if (ins[1]=="ispath") {
							stack.push(new NodeBinary(stack.pop(),"is",new NodeClass("Type")));
						} else if (ins[1]=="ispath2") { // ONE OF THESE TWO IS WRONG
							var arg2 = stack.pop();
							stack.push(new NodeCall(new NodeIndex(stack.pop(),"$IsSubclassOf") ,[arg2]));

						} else if (ins[1]=="hascall") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Lang13"),"hascall"),[stack.pop(),stack.pop()].reverse()));


						} else if (ins[1]=="text2path") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Lang13"),"findClass"),[stack.pop()]));

						
						} else if (ins[1]=="locate_in") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Lang13"),"FindIn"),[stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="locate1") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Lang13"),"FindObj"),[stack.pop()].reverse()));




						// ICON SHIT -- GOOD
						} else if (ins[1]=="icon") {
							var args = [];
							for (var jj=0;jj<ins[2];jj++) {
								args.push(stack.pop());
							}

							stack.push(new NodeCall(new NodeIndex(new NodeClass("Icon13"),"create"),args.reverse()));

						} else if (ins[1]=="icon_oper_map_colors") {
							var args = [];
							for (var jj=0;jj<ins[2]+1;jj++) {
								args.push(stack.pop());
							}

							stack.push(new NodeCall(new NodeIndex(new NodeClass("Icon13"),"oper_map_colors"),args.reverse()));
						} else if (ins[1]=="icon_oper") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Icon13"),"oper"),[ins[2],fetch_oper(ins[3]),stack.pop()]));
						} else if (ins[1]=="icon_oper_set_intensity") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Icon13"),"oper_set_intensity"),[stack.pop(),stack.pop(),stack.pop(),fetch_oper(ins[2])].reverse()));
						} else if (ins[1]=="icon_oper_swap_color") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Icon13"),"oper_swap_color"),[stack.pop(),stack.pop(),fetch_oper(ins[2])].reverse()));
						} else if (ins[1]=="icon_oper_shift") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Icon13"),"oper_shift"),[stack.pop(),stack.pop(),stack.pop(),fetch_oper(ins[2])].reverse()));
						} else if (ins[1]=="icon_oper_draw_box") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Icon13"),"oper_draw_box"),[stack.pop(),stack.pop(),stack.pop(),stack.pop(),stack.pop(),fetch_oper(ins[2])].reverse()));
						} else if (ins[1]=="icon_oper_insert") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Icon13"),"oper_insert"),[stack.pop(),stack.pop(),stack.pop(),stack.pop(),stack.pop(),stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="icon_oper_scale") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Icon13"),"oper_scale"),[stack.pop(),stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="icon_oper_crop") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Icon13"),"oper_crop"),[stack.pop(),stack.pop(),stack.pop(),stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="icon_oper_states") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Icon13"),"states"),[stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="icon_oper_getpixel") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Icon13"),"oper_getpixel"),[stack.pop(),stack.pop(),stack.pop(),stack.pop(),stack.pop(),stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="icon_oper_blend") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Icon13"),"oper_blend"),[stack.pop(),stack.pop(),stack.pop(),stack.pop(),fetch_oper(ins[2])].reverse()));
						} else if (ins[1]=="icon_oper_dim") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Icon13"),"oper_dim"),[stack.pop(),stack.pop()].reverse()));
						

						} else if (ins[1]=="icon_states") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Icon13"),"states"),[stack.pop(),stack.pop()]));
						} else if (ins[1]=="animate") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Icon13"),"Animate"),[stack.pop()]));
						} else if (ins[1]=="animate_listcall") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Icon13"),"Animate"),[stack.pop()]));
						} else if (ins[1]=="flick") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Icon13"),"Flick"),[stack.pop(),stack.pop()].reverse()));
						




						// FILE -- GOOD
						} else if (ins[1]=="fexists") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("File13"),"exists"),[stack.pop()]));
						} else if (ins[1]=="fdel") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("File13"),"delete"),[stack.pop()]));
						} else if (ins[1]=="fcopy") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("File13"),"Copy"),[stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="flist") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("File13"),"list"),[stack.pop()]));
						} else if (ins[1]=="file2text") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("File13"),"read"),[stack.pop()]));
						} else if (ins[1]=="text2file") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("File13"),"Write"),[stack.pop(),stack.pop()]));
						} else if (ins[1]=="fcopy_rsc") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("File13"),"Cache"),[stack.pop()]));



					
						// else if (ins[1]=="initial") {
						//	stack.push(new NodeCall(new NodeIndex(new NodeClass("Misc13"),"initial_LOOK_AT_ME"),[stack.pop()]));


						// STRING -- GOOD
						} else if (ins[1]=="length") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Lang13"),"length"),[stack.pop()]));


						} else if (ins[1]=="cat") {
							var args = [];
							for (var jj=0;jj<ins[2];jj++) {
								args.push(stack.pop());
							}

							stack.push(new NodeCall(new NodeIndex(new NodeClass("String13"),"Concat"),args.reverse()));

						} else if (ins[1]=="sorttext") {
							var args = [];
							for (var jj=0;jj<ins[2];jj++) {
								args.push(stack.pop());
							}

							stack.push(new NodeCall(new NodeIndex(new NodeClass("String13"),"order"),args.reverse()));

						} else if (ins[1]=="cmptext") {
							cond = new NodeCall(new NodeIndex(new NodeClass("String13"),"compare"),[stack.pop(),stack.pop()]);
						} else if (ins[1]=="findtext") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("String13"),"find"),[stack.pop(),stack.pop(),stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="findtextEx") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("String13"),"find_exact_case"),[stack.pop(),stack.pop(),stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="copytext") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("String13"),"substr"),[stack.pop(),stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="uppertext") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("String13"),"toUpper"),[stack.pop()]));
						} else if (ins[1]=="lowertext") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("String13"),"toLower"),[stack.pop()]));
						} else if (ins[1]=="num2text") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("String13"),"numberToString"),[stack.pop()]));
						} else if (ins[1]=="num2text2") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("String13"),"numberToString"),[stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="text2ascii") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("String13"),"getCharCode"),[stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="ascii2text") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("String13"),"codeToChar"),[stack.pop()]));



						} else if (ins[1]=="rgb") {
							stack.push(new NodeCall( new NodeIndex(new NodeClass("String13"),"color_code") ,[stack.pop(),stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="rgba") {
							stack.push(new NodeCall( new NodeIndex(new NodeClass("String13"),"color_code") ,[stack.pop(),stack.pop(),stack.pop(),stack.pop()].reverse()));


						} else if (ins[1]=="time2text") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("String13"),"formatTime"),[stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="text2num") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("String13"),"parseNumber"),[stack.pop()]));
						} else if (ins[1]=="list2params") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("String13"),"conv_list2urlParams"),[stack.pop()]));
						} else if (ins[1]=="params2list") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("String13"),"conv_urlParams2list"),[stack.pop()]));




						} else if (ins[1]=="html_encode") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("String13"),"html_encode"),[stack.pop()]));
						} else if (ins[1]=="html_decode") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("String13"),"html_decode"),[stack.pop()]));
						} else if (ins[1]=="url_encode") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("String13"),"url_encode"),[stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="url_decode") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("String13"),"url_decode"),[stack.pop()]));




						} else if (ins[1]=="ckey") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("String13"),"ckey"),[stack.pop()]));
						} else if (ins[1]=="ckeyEx") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("String13"),"ckey_preserve_case"),[stack.pop()]));


						
						
						




						// MAP -- GOOD
						} else if (ins[1]=="locate3") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Map13"),"get_tile_at"),[stack.pop(),stack.pop(),stack.pop()].reverse()));
						

						} else if (ins[1]=="step") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Map13"),"step"),[stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="step_to") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Map13"),"step_towards"),[stack.pop(),stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="step_away") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Map13"),"step_away"),[stack.pop(),stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="step_towards") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Map13"),"step_towards_stupid"),[stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="step_rand") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Map13"),"step_rand"),[stack.pop()].reverse()));

						} else if (ins[1]=="step_towards_3") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Map13"),"step_towards_stupid"),[stack.pop(),stack.pop(),stack.pop()].reverse()));
						
						} else if (ins[1]=="get_step") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Map13"),"get_step"),[stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="get_step_to") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Map13"),"get_step_towards"),[stack.pop(),stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="get_step_away") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Map13"),"get_step_away"),[stack.pop(),stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="get_step_towards") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Map13"),"get_step_towards_stupid"),[stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="get_step_rand") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Map13"),"get_step_rand"),[stack.pop(),stack.pop()].reverse()));
						
						} else if (ins[1]=="walk") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Map13"),"walk"),[stack.pop(),stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="walk_to") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Map13"),"walk_towards"),[stack.pop(),stack.pop(),stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="walk_away") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Map13"),"walk_away"),[stack.pop(),stack.pop(),stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="walk_towards") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Map13"),"walk_towards_stupid"),[stack.pop(),stack.pop(),stack.pop()].reverse()));

						} else if (ins[1]=="orange") {
							ins = f.code[++i];
							if (ins[0]!="std"||ins[1]!="range_b")
								throw "bad_orange!";
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Map13"),"fetch_in_range_nocenter"),[stack.pop(),stack.pop()]));
						} else if (ins[1]=="range_a") {
							ins = f.code[++i];
							if (ins[0]!="std"||ins[1]!="range_b")
								throw "bad_range!";
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Map13"),"fetch_in_range"),[stack.pop(),stack.pop()]));
						} else if (ins[1]=="block") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Map13"),"fetch_in_block"),[stack.pop(),stack.pop()].reverse()));

						} else if (ins[1]=="view") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Map13"),"fetch_in_view"),[stack.pop(),stack.pop()]));
						} else if (ins[1]=="oview") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Map13"),"fetch_in_view_nocenter"),[stack.pop(),stack.pop()]));
						} else if (ins[1]=="viewers") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Map13"),"fetch_viewers"),[stack.pop(),stack.pop()]));
						} else if (ins[1]=="oviewers") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Map13"),"fetch_viewers_nocenter"),[stack.pop(),stack.pop()]));

						} else if (ins[1]=="hearers") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Map13"),"fetch_hearers"),[stack.pop(),stack.pop()]));
						} else if (ins[1]=="ohearers") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Map13"),"fetch_hearers_nocenter"),[stack.pop(),stack.pop()]));


						} else if (ins[1]=="get_dist") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Map13"),"get_dist"),[stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="get_dist2") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Map13"),"get_dist"),[stack.pop(),stack.pop()].reverse()));






					





						// THREAD -- GOOD
						} else if (ins[1]=="sleep") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Task13"),"Sleep"),[stack.pop()]));
						
						} else if (ins[1]=="crash") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Task13"),"Crash"),[stack.pop()]));



					
						





						// MATH -- GOOD
						} else if (ins[1]=="abs") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Math"),"Abs"),[stack.pop()]));
						} else if (ins[1]=="sin") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Math"),"Sin"),[stack.pop()]));
						} else if (ins[1]=="cos") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Math"),"Cos"),[stack.pop()]));
						} else if (ins[1]=="arcsin") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Math"),"Asin"),[stack.pop()]));
						} else if (ins[1]=="arccos") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Math"),"Acos"),[stack.pop()]));
						} else if (ins[1]=="round") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Num13"),"floor"),[stack.pop()]));
						} else if (ins[1]=="round2") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Num13"),"round"),[stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="log") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Math"),"Log"),[stack.pop()]));
						} else if (ins[1]=="log2") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Math"),"Log"),[stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="sqrt") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Math"),"Sqrt"),[stack.pop()]));
						} else if (ins[1]=="min") {
							var args = [];
							for (var jj=0;jj<ins[2];jj++) {
								args.push(stack.pop());
							}

							stack.push(new NodeMinMax(args.reverse(),false));				//  new NodeCall(new NodeIndex(new NodeClass("Num13"),"min"),args.reverse()));
						} else if (ins[1]=="max") {
							var args = [];
							for (var jj=0;jj<ins[2];jj++) {
								args.push(stack.pop());
							}

							stack.push(	new NodeMinMax(args.reverse(),true));				//new NodeCall(new NodeIndex(new NodeClass("Num13"),"max"),args.reverse()));
						} else if (ins[1]=="min_listcall") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Num13"),"Min"),[stack.pop()]));
						} else if (ins[1]=="max_listcall") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Num13"),"Max"),[stack.pop()]));
						} else if (ins[1]=="turn") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Num13"),"rotate_dir"),[stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="md5") {
							var md5_arg = stack.pop();

							if (md5_arg instanceof Array && md5_arg[0]=="rsc") {
								md5_arg = new NodeCall(new NodeIndex(new NodeClass("File13"),"read"),[md5_arg]);
							}

							stack.push(new NodeCall(new NodeIndex(new NodeClass("Num13"),"Md5"),[md5_arg]));

						// CTORS
						} else if (ins[1]=="image") {
							stack.push(new NodeCall(new NodeClass("Image"),[stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="image_listcall") {
							//stack.push(new NodeCall(new NodeIndex(["class","Image"],"BTNew"),[stack.pop()]));
							//console.log("===>"+f.varData.name);

							/*var mmmm = stack[stack.length-1].data;
							mmmm.forEach(function(v,k) {
								if (k=="pixel_x" || k=="pixel_y")
									console.log("===>"+f.varData.name);
							});*/
							//console.log(stack[stack.length-1].data.constructor.name);
							stack.push(new NodeListCall(new NodeClass("Image"),stack.pop()));
						} else if (ins[1]=="image_n") {
							var args = [];
							for (var jj=0;jj<ins[2];jj++) {
								args.push(stack.pop());
							}

							stack.push(new NodeCall(new NodeClass("Image"),args.reverse()));
						} else if (ins[1]=="matrix") {
							var args = [];
							for (var jj=0;jj<ins[2];jj++) {
								args.push(stack.pop());
							}

							stack.push(new NodeCall(new NodeIndex(new NodeClass("Num13"),"matrix"),args.reverse()));





						



						// DB -- GOOD
						} else if (ins[1]=="db_op") {
							var args = [];
							for (var jj=0;jj<ins[2];jj++) {
								args.push(stack.pop());
							}

							stack.push(new NodeCall(new NodeIndex(new NodeClass("DB13"),"op"),args.reverse()));
						} else if (ins[1]=="_dm_db_new_con") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("DB13"),"new_con"),[]));
						} else if (ins[1]=="_dm_db_new_query") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("DB13"),"new_query"),[]));
						} else if (ins[1]=="_dm_db_connect") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("DB13"),"connect"),[stack.pop(),stack.pop(),stack.pop(),stack.pop(),stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="_dm_db_execute") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("DB13"),"execute"),[stack.pop(),stack.pop(),stack.pop(),stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="_dm_db_next_row") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("DB13"),"next_row"),[stack.pop(),stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="_dm_db_error_msg") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("DB13"),"error_msg"),[stack.pop()]));
						} else if (ins[1]=="_dm_db_close") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("DB13"),"close"),[stack.pop()]));
						} else if (ins[1]=="_dm_db_is_connected") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("DB13"),"is_connected"),[stack.pop()]));
						} else if (ins[1]=="_dm_db_rows_affected") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("DB13"),"rows_affected"),[stack.pop()]));
						} else if (ins[1]=="_dm_db_row_count") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("DB13"),"row_count"),[stack.pop()]));
						} else if (ins[1]=="_dm_db_quote") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("DB13"),"quote"),[stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="_dm_db_columns") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("DB13"),"columns"),[stack.pop(),stack.pop()].reverse()));
							

						


						// RANDOM -- GOOD
						} else if (ins[1]=="rand1") {
							var rand_arg = stack.pop();
							if (rand_arg==null)
								stack.push(new NodeCall(new NodeIndex(new NodeClass("Rand13"),"Float"),[]));
							else
								stack.push(new NodeCall(new NodeIndex(new NodeClass("Rand13"),"Int"),[rand_arg]));
						} else if (ins[1]=="rand") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Rand13"),"Int"),[stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="prob") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Rand13"),"PercentChance"),[stack.pop()]));
						} else if (ins[1]=="pick_list") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Rand13"),"PickFromTable"),[stack.pop()]));

						//} else if (ins[1]=="pick") {
						//	stack.push(new NodeCall(new NodeGlobalVar("pick"),[stack.pop()]));



						
						
						
						



						// SYSTEM -- GOOD
						} else if (ins[1]=="shell") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Sys13"),"execute"),[stack.pop()]));

						} else if (ins[1]=="shutdown") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Sys13"),"Shutdown"),[]));
						
						

						
						

						



						// UI -- GOOD
						} else if (ins[1]=="ftp") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Interface13"),"SendFile"),[stack.pop(),stack.pop(),stack.pop()].reverse()));


						} else if (ins[1]=="stat_panel") {
							cond = new NodeCall(new NodeIndex(new NodeClass("Interface13"),"is_stat_panel_active"),[stack.pop()]);

						} else if (ins[1]=="stat_panel3") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Interface13"),"SetStatPanel"),[stack.pop(),stack.pop(),stack.pop()].reverse()));


						} else if (ins[1]=="browse") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Interface13"),"Browse"),[stack.pop(),stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="browse_rsc") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Interface13"),"CacheBrowseResource"),[stack.pop(),stack.pop(),stack.pop()].reverse()));
						

						} else if (ins[1]=="winset") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Interface13"),"WindowSet"),[stack.pop(),stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="winget") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Interface13"),"window_get"),[stack.pop(),stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="winclone") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Interface13"),"WindowClone"),[stack.pop(),stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="winshow") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Interface13"),"WindowShow"),[stack.pop(),stack.pop(),stack.pop()].reverse()));
						} else if (ins[1]=="winexists") {
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Interface13"),"window_exists"),[stack.pop(),stack.pop()].reverse()));

						} else if (ins[1]=="link") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Interface13"),"Link"),[stack.pop(),stack.pop()].reverse()));

						} else if (ins[1]=="run") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Interface13"),"OpenFile"),[stack.pop(),stack.pop()].reverse()));

						} else if (ins[1]=="output") {
							add_node(new NodeCall(new NodeIndex(new NodeClass("Interface13"),"Output"),[stack.pop(),stack.pop(),stack.pop()].reverse()));
						
						} else if (ins[1]=="alert") {
							var alert_args = [stack.pop(),stack.pop(),stack.pop(),stack.pop(),stack.pop(),stack.pop()].reverse();
							while (alert_args[alert_args.length-1] == null)
								alert_args.pop();

							stack.push(new NodeCall(new NodeIndex(new NodeClass("Interface13"),"alert"),alert_args));

						} else if (ins[1]=="input" || ins[1]=="input_alt") {
							//if (ins[3]!=0 || ins[5]!=186)
							//	throw "goofy input"

							var input_args = [stack.pop(),stack.pop(),stack.pop(),stack.pop()].reverse();
							
							if (ins[4]==64)
								input_args.push(stack.pop());
							else if (ins[4]==0)
								input_args.push(null);
							else if (ins[4]==16)
								input_args.push(new NodeIndex(new NodeClass("Game13"),"contents"));
							else
								throw "very goofy input "+ins[4];

							input_args.push([ "input_type", ins[1]=="input_alt"?stack.pop():ins[2] ]);
							//if (ins[1]=="input_alt")
							//	console.log(input_args[input_args.length-1])

							//console.log("-->",ins[2],ins[3],ins[4],ins[5]);
							stack.push(new NodeCall(new NodeIndex(new NodeClass("Interface13"),"input"),input_args));
						} else {
							throw "stdfunc "+ins[1];
						}
						break;
					case "dbg": //don't bother with these for now. (maybe ever!)
						if (ins[1]=="line") {
							last_debug_i= i;
							node_start_i= null//i; //actually, fuck the police!
						} else if (ins[1]=="file") {
							f.file = ins[2];
						}
						break;
					case "decode_fail":
					/*
						if (fail_stats[ins[1]]==null)
							fail_stats[ins[1]]=1;
						else
							fail_stats[ins[1]]++;*/
					default:
						throw "fail "+ins;
				}

				//Restructure Ifs!
				if (trails.has(i+1)) {
					//console.log("."+f.name+" "+(i+1)+" ");
					var levels = trails.get(i+1);
					while (levels.length>0) {
						//console.log("--")
						var base_if = levels.pop();
						if (nodes.indexOf(base_if)!=-1) {
							//console.log("~",base_if);
							var else_code = [];
							var pop_node = nodes.pop();
							while (pop_node!=base_if) {
								else_code.push(pop_node);
								pop_node = nodes.pop();
							}
							nodes.push(pop_node); //restore [if] to node list
							base_if.list_true.pop();
							base_if.list_false = else_code.reverse();
						}
						delete base_if.trail;
					}
					trails.delete(i+1);

					//console.log("]]",trails.get(i+1));
				}

				//console.log("stack =",stack,"cond =",cond,"\n");
			}

			//console.log("<---\n");

			return {stack: stack,nodes: nodes, last_base: last_base}
		}

		var decompiled = smart_decompile(f.code.length).nodes;
		
		for (;;) {
			var dc_last = decompiled[decompiled.length-1];
			var dc_last2 = decompiled[decompiled.length-2];
			if (dc_last instanceof NodeReturn && dc_last2 instanceof NodeReturn)
				decompiled.pop();
			else if (dc_last instanceof NodeReturn && dc_last2 instanceof NodeIfElse) {
				var sub_last_t = dc_last2.list_true[dc_last2.list_true.length-1];
				var sub_last_f = dc_last2.list_false[dc_last2.list_false.length-1];
				if (sub_last_t instanceof NodeReturn && sub_last_f instanceof NodeReturn)
					decompiled.pop();
				else
					break;
			} else
				break;
		}

		if (f.uses_defret && f.varData.type=="void")
			f.varData.type = null;

		/*if (prune_returns) {
			for (var id=decompiled.length-1;id>=0;id--)
			if (decompiled[id] instanceof NodeReturn) {
				decompiled.splice(id,1);
			}
		}*/

		return decompiled; //  expand_list(decompiled,block_tabs);
	}

	function unfuck_ctor(c) {
		var ctor = c.func_ctor;

		var ctor_init;
		if (ctor!=null && ctor.dc != null) {
			var used_def = ctor.uses_defret;
			if (used_def) {
				ctor.uses_defret=false;;
			}

			for (var i=0;i<ctor.dc.length;i++) {
				var e = ctor.dc[i];
				if (e instanceof NodeCall && e.func instanceof NodeSuper) {
					if (ctor_init!=null)
						throw "multi ctors!";
					ctor_init = e;
					ctor.dc[i] = new NodeSuperWarning();
					//ctor.dc.splice(i--,1);
				} else if (e instanceof NodeReturn && e.value instanceof NodeCall && e.value.func instanceof NodeSuper) {
					if (ctor_init!=null)
						throw "multi ctors!";
					ctor_init = e.value;
					e.value = null;
					ctor.dc.splice(i,0,new NodeSuperWarning());
				} else if (e instanceof NodeBinary && e.left instanceof NodeDefault && e.op=="=" && e.right instanceof NodeCall && e.right.func instanceof NodeSuper) {
					if (ctor_init!=null)
						throw "multi ctors!";
					ctor_init = e.right;
					ctor.dc[i] = new NodeSuperWarning();
					//ctor.dc.splice(i--,1);
				}
			}

			function unfuck_r(list) {
				for (var i=0;i<list.length;i++) {
					var e = list[i];
					if (e instanceof NodeReturn) {
						if (used_def) {
							if (e.value instanceof NodeDefault) {
								e.value = null;
							} else {
								//list.splice(i++,0,new NodeThrow(new NodeCall(["class","/exception"],["Ctor fault."])));
								e.warning = "Warning! Attempt to return some other value!";
								e.value = null;
							}
						} else {
							if (e.value != null) {
								//list.splice(i++,0,new NodeThrow(new NodeCall(["class","/exception"],["Ctor fault."])));
								e.warning = "Warning! Attempt to return some other value!";
								e.value = null;
							}
						}
					} else if (e instanceof NodeIfElse) {
						unfuck_r(e.list_true);
						unfuck_r(e.list_false);
					}
				}
			}
			unfuck_r(ctor.dc);

			//Get them trailing returns out of here!

			/*if (ctor.dc[ctor.dc.length-1] instanceof NodeReturn) {

			}*/
		}

		var parent_ctor;
		if (c.parent != null)
			parent_ctor = c.parent.func_ctor;

		if (parent_ctor!=null) {
			if (ctor!=null && ctor.dc != null) {
				//if (c.name=="BaseDynamic")
				//	throw "ARE YOU HAPPY?"

				var is_atom = false;
				var ic = c;
				while (ic != null) {
					if (ic.path=="/atom") {
						//console.log("GOT 1");
						is_atom = true;
						break;
					}
					ic = ic.parent;
				}

				if (is_atom && ctor.args.length>0) {
					ctor.args[0].type = "dynamic";
				}

				if (ctor_init==null)
					ctor_init = new NodeCall(new NodeSuper(c.parent),[]);


				while (ctor_init.args.length < parent_ctor.args.length) {
					var arg_i = ctor_init.args.length;

					var arg_v = ctor.args[arg_i];

					if (arg_v==null) {
						ctor.args[arg_i] = parent_ctor.args[arg_i];//.clone(); //POSSIBLE NAME CONFLICT SOURCE parent_ctor.args[arg_i];
						arg_v = ctor.args[arg_i];
					}

					var new_arg = new NodeLocalVar( arg_v );
					new_arg.argument_hint = true;
					ctor_init.args.push( new_arg );
				}



				if (ctor_init.args.length>0)
					ctor.ctor_init = ctor_init;
				// reconcile ctors

				// RECONCILE NAMES HERE!
				var collision_table = {};

				ctor.args.forEach(function(vd) {
					while (collision_table[vd.name]) {
						//var old_name = vd.name;
						vd.name = vd.name+"_";
						//console.log("changed",old_name,vd.name);
					}
					collision_table[vd.name] = true;
				});

				ctor.vars.forEach(function(vd) {
					while (collision_table[vd.name]) {
						//var old_name = vd.name;
						vd.name = vd.name+"_";
						//console.log("changed",old_name,vd.name);
					}
					collision_table[vd.name] = true;
				});


			} else if (parent_ctor.args.length>0) { //generate a ctor!
				var new_ctor = {};

				new_ctor.args = [];
				new_ctor.vars = [];

				var init_args = [];

				parent_ctor.args.forEach(function(a) {
					var new_a = a;//.clone();
					new_ctor.args.push(new_a);
					
					var new_arg = new NodeLocalVar(new_a);
					new_arg.argument_hint = true;
					init_args.push( new_arg );
				})

				new_ctor.varData = new name_lib.NodeVar();
				new_ctor.varData.type = c.name;

				new_ctor.ctor_init = new NodeCall(new NodeSuper(c.parent), init_args );

				new_ctor.dc = [];

				c.func_ctor = new_ctor;
			}
		} else if (ctor!=null && ctor.dc != null) {
			if (ctor_init!=null && ctor_init.args.length>0) {
				throw ( "ctor attempt to call nonexistant parent ctor "+c.name );
			}
		}

		c.children.forEach(unfuck_ctor);
	}

	return {decompile: decomp_func, expand: expand_node, expand_list: expand_list, unfuck_ctor: unfuck_ctor};
}

module.exports = {new_decompiler: new_decompiler, fail_stats: fail_stats, goto_stats: function() {return goto_stats}};
