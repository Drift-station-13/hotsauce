#include <cstdio>
#include <cstring>
//#include <windows.h>

//using namespace std;
/*
typedef void (__stdcall *f_ctor)(void*);

int main() {
	HMODULE module = LoadLibrary("byondcore.dll");
	
	if (!module) {
		cout << "No Module!" << endl;
		return 1;
	}
	
	f_ctor my_little_ctor = GetProcAddress(module, "");
	
	cout << "Yo!" << endl;
	return 0;
}
*/

/*

8
	- Discovered map is RL encoded.
	- Started work on reader -- Reads map data and (hopefully) obj protos.
	- Figured out identities of some other proto types.
9
	- Retarget Version 509
	- Reads mob protos
	- Reads string protos
	- Reads id array protos
	- Reads proc protos
*/

//const char* TARGET_HEADER = "world bin v501\nmin compatibility v501 501\n";

#define TARGET_HEADER "world bin v509\nmin compatibility v"

const int HEADER_LEN = sizeof TARGET_HEADER - 1;

unsigned char read_char(FILE* f) {
	char c = fgetc(f);
	//printf("[%hhu",c);
	return c;
}

//define read_char fgetc

unsigned short read_short(FILE* f) {
	
	unsigned short a = read_char(f);
	
	//printf("->%hu]",a);
	
	//short c = 0;
	//c |= read_char(f);
	//c << 8;
	//c |= a;
	//return 
	
	
	unsigned short b = read_char(f);
	return (b << 8) | a;
}

unsigned int read_int(FILE* f) {
	unsigned int a = read_short(f);
	unsigned int b = read_short(f);
	return (b << 16) | a;
}

float read_float(FILE* f) {
	int a = read_int(f);
	return *reinterpret_cast<float*>(&a);
}

int FLAGS_1;
int FLAGS_2;

unsigned int read_vint(FILE* f) {
	if (FLAGS_1 & 0x40000000) {
		//printf("long");
		return read_int(f);
	} else {
		return read_short(f); //this might not work? how are negatives handled?
	}
}

struct triple {
	int x;
	int y;
	int z;
};

triple read_triple(FILE* f) {
	triple t;
	
	t.x = read_vint(f);
	t.y = read_vint(f);
	t.z = read_vint(f);

	return t;
}

struct proto_obj {
	int a1 = 0xFFFF;
	int a2 = 0xFFFF;
	int a3 = 0xFFFF;
	int a4 = 0xFFFF;
	int a5 = 0xFFFF;
	int a6 = 0xFFFF;
	
	int n1 = 0xFFFF;
	int n2 = 0xFFFF;
	
	short m1 = 0;
	short m2 = 0;
	short m3 = 0;
	short m4 = 0;
	
	char ch = 0;
	
	//matrix mm
	
	int z1 = 0;
	
	int b = 0xFFFF;
	
	int z2 = 0;
	
	short x1 = 0x0002;
	short x2 = 0x0001;
	float y = -1;
	
	int c1 = 0xFFFF;
	int c2 = 0xFFFF;
	int c3 = 0xFFFF;
	int c4 = 0xFFFF;
	int c5 = 0xFFFF;
	int c6 = 0xFFFF;
};

short MAP_SIZE_X;
short MAP_SIZE_Y;
short MAP_SIZE_Z;

int MAP_SIZE_LEVEL;
int MAP_SIZE_FULL;

int* MAP_ARRAY_1;
int* MAP_ARRAY_2;

//#define INPUT_NAME "test/test"

int main(int argc,char** argv) {
	if (argc!=4) {
		printf("Bad args!\n");
		return 1;
	}


	char* fname_in = argv[1];
	char* fname_out_dump = argv[2];
	char* fname_out_map = argv[3];

	// Open file
	
	FILE* binfile = fopen(fname_in,"rb");
	
	if (!binfile) {printf("Failed to open binary!\n"); return 1;}
	
	// Check header string
	
	char header_str[HEADER_LEN];
	
	fread(header_str,1,HEADER_LEN,binfile);
	
	if (!memcmp(header_str,TARGET_HEADER,HEADER_LEN)) {
		printf("Header string good!\n");
	} else {
		printf("Header string bad!\n");
		return 1;
	}
	
	fseek(binfile, 4, SEEK_CUR);
	
	int compat_version;
	
	fscanf(binfile,"%i",&compat_version);
	fseek(binfile, 1, SEEK_CUR);
	
	printf("Compat version: %i\n",compat_version);
	
	//printf("--> %hhi %hhi\n",read_char(binfile),read_char(binfile));
	
	// Get flags
	
	FLAGS_1 = read_int(binfile);
	
	if (FLAGS_1 & 0x80000000) {
		printf("Warning! Flags #2 present!\n");
		//read_char(binfile);
		//read_char(binfile);
		//read_char(binfile);
		//read_char(binfile);
		
		//read_char(binfile);
		//read_char(binfile);
		//read_char(binfile);
		FLAGS_2 = read_int(binfile);
	}
	
	// Start is good, begin writing output!
	
	// Read map data
	
	FILE* file_out_map = fopen(fname_out_map,"wb");
	
	MAP_SIZE_X = read_short(binfile);
	MAP_SIZE_Y = read_short(binfile);
	MAP_SIZE_Z = read_short(binfile);
	
	MAP_SIZE_LEVEL = MAP_SIZE_X*MAP_SIZE_Y;
	MAP_SIZE_FULL = MAP_SIZE_LEVEL*MAP_SIZE_Z;
	
	fwrite(&MAP_SIZE_X,2,1,file_out_map);
	fwrite(&MAP_SIZE_Y,2,1,file_out_map);
	fwrite(&MAP_SIZE_Z,2,1,file_out_map);
	
	fputc('-',file_out_map);
	fputc('-',file_out_map);
	
	printf("MAP SIZE: %i %i %i\n",MAP_SIZE_X,MAP_SIZE_Y,MAP_SIZE_Z);
	
	//MAP_ARRAY_1 = new int[MAP_SIZE_FULL];
	//MAP_ARRAY_2 = new int[MAP_SIZE_FULL];
	
	int i=0;
	
	while (i<MAP_SIZE_FULL) {
		triple tile = read_triple(binfile);
		char c = read_char(binfile);
		if (i+c > MAP_SIZE_FULL) {
			printf("Bad map data!\n");
			return 1;
		}

		while (c!=0) {
			//printf(">>>>>>%i\n",ftell(file_out_map));
			fwrite(&tile,4,3,file_out_map);
			i++;
			c--;
		}
	}
	//printf("-->%i\n",ftell(file_out_map));
	fclose(file_out_map);
	
	// Protos
	
	FILE* file_out_protos = fopen(fname_out_dump,"wb");
	
	fprintf(file_out_protos,"{\n\"objs\": [\n");
	
	int proto_block_size = read_int(binfile);
	
	int proto_obj_count = read_vint(binfile);
	
	printf("OBJ COUNT: %i\n",proto_obj_count);
	
	for (int i=0;i<proto_obj_count;i++) {
		proto_obj p;
		
		p.a1 = read_vint(binfile);
		p.a2 = read_vint(binfile);
		p.a3 = read_vint(binfile);
		p.a4 = read_vint(binfile);
		p.a5 = read_vint(binfile);
		p.a6 = read_vint(binfile);
		
		p.x1 = read_char(binfile);
		
		p.x2 = read_char(binfile);
		
		//printf("~~ %i\n",nn);
		
		if (p.x2==15) {
			p.x2 = read_int(binfile);
			//printf("~~ ALERT\n");
		}
		
		//p.x2 = nn;
		
		// good to here!
		
		p.n1 = read_vint(binfile);
		
		if (compat_version>=494) {
		
			p.n2 = read_vint(binfile);
		
			p.m1 = read_short(binfile);
			p.m2 = read_short(binfile);
			
			if (compat_version>=508) {
				p.m3 = read_short(binfile);// THESE HAD TO BE CORRECTED VIA A GUESS. MAY BE WRONG.
				p.m4 = read_short(binfile);
			}
		}
		
		p.b = read_vint(binfile);
		
		p.z2 = read_int(binfile);
		
		p.c1 = read_vint(binfile);
		p.c2 = read_vint(binfile);
		p.c3 = read_vint(binfile);
		p.c4 = read_vint(binfile);
		p.c5 = read_vint(binfile);
		
		
		p.y = read_float(binfile);
		
		
		if (compat_version>=500) {
			p.ch = read_char(binfile);
			
			if (p.ch!=0) {
				//printf("READ FLOATS! %i\n",p.ch);
				//TODO ADD MATRIX STRUCTURE
				float fff1 = read_float(binfile);
				float fff2 = read_float(binfile);
				float fff3 = read_float(binfile);
				float fff4 = read_float(binfile);
				float fff5 = read_float(binfile);
				float fff6 = read_float(binfile);
				//printf(">--> %f %f %f %f %f %f\n",fff1,fff2,fff3,fff4,fff5,fff6);
			}
		}
		
		float ccc1,ccc2,ccc3,ccc4,ccc5;
		float ccc6,ccc7,ccc8,ccc9,ccc10;
		float ccc11,ccc12,ccc13,ccc14,ccc15;
		float ccc16,ccc17,ccc18,ccc19,ccc20;
		
		if (compat_version>=509 && read_char(binfile)!=0) {
			//printf("COLOR!\n");
			ccc1 = read_float(binfile);
			ccc2 = read_float(binfile);
			ccc3 = read_float(binfile);
			ccc4 = read_float(binfile);
			ccc5 = read_float(binfile);
			ccc6 = read_float(binfile);
			ccc7 = read_float(binfile);
			ccc8 = read_float(binfile);
			ccc9 = read_float(binfile);
			ccc10 = read_float(binfile);
			ccc11 = read_float(binfile);
			ccc12 = read_float(binfile);
			ccc13 = read_float(binfile);
			ccc14 = read_float(binfile);
			ccc15 = read_float(binfile);
			ccc16 = read_float(binfile);
			ccc17 = read_float(binfile);
			ccc18 = read_float(binfile);
			ccc19 = read_float(binfile);
			ccc20 = read_float(binfile);
		} else {
			//printf("NO COLOR!\n");
			ccc1 = 1;
			ccc2 = 1;
			ccc3 = 1;
			ccc4 = 1;
			ccc5 = 1;
			ccc6 = 1;
			ccc7 = 1;
			ccc8 = 1;
			ccc9 = 1;
			ccc10 = 1;
			ccc11 = 1;
			ccc12 = 1;
			ccc13 = 1;
			ccc14 = 1;
			ccc15 = 1;
			ccc16 = 1;
			ccc17 = 1;
			ccc18 = 1;
			ccc19 = 1;
			ccc20 = 1;
		}
		
		p.c6 = read_vint(binfile);
		
		//printf("y = %f\n",p.y);
		
		fprintf(file_out_protos,"{\n");
		
		/*
		printf("=========================================================\n");
		*/
		fprintf(file_out_protos,"\t\"str_path\": %i,\n",p.a1);
		fprintf(file_out_protos,"\t\"obj_parent\": %i,\n",p.a2);
		fprintf(file_out_protos,"\t\"str_name\": %i,\n",p.a3);
		fprintf(file_out_protos,"\t\"a4\": %i,\n",p.a4);
		fprintf(file_out_protos,"\t\"a5\": %i,\n",p.a5);
		fprintf(file_out_protos,"\t\"a6\": %i,\n",p.a6);
		
		//fprintf("\n");
		
		fprintf(file_out_protos,"\t\"str_char1\": %i,\n",p.n1);
		fprintf(file_out_protos,"\t\"n2\": %i,\n",p.n2);
		
		//fprintf("\n");
		
		fprintf(file_out_protos,"\t\"m1\": %i,\n",p.m1);
		fprintf(file_out_protos,"\t\"m2\": %i,\n",p.m2);
		fprintf(file_out_protos,"\t\"m3\": %i,\n",p.m3);
		fprintf(file_out_protos,"\t\"m4\": %i,\n",p.m4);
		
		//printf("x -> %i\n",p.x);
		
		//printf("\n");
		
		fprintf(file_out_protos,"\t\"ch\": %i,\n",p.ch);
		fprintf(file_out_protos,"\t\"z1\": %i,\n",p.z1);
		fprintf(file_out_protos,"\t\"b\": %i,\n",p.b);
		fprintf(file_out_protos,"\t\"z2\": %i,\n",p.z2);
		
		//printf("\n");
		
		fprintf(file_out_protos,"\t\"x1\": %i,\n",p.x1);
		fprintf(file_out_protos,"\t\"x2\": %i,\n",p.x2);
		fprintf(file_out_protos,"\t\"y\": %f,\n",p.y);
		
		fprintf(file_out_protos,"\t\"array_verbs\": %i,\n",p.c1);
		fprintf(file_out_protos,"\t\"array_procs\": %i,\n",p.c2);
		fprintf(file_out_protos,"\t\"proc_init\": %i,\n",p.c3);
		fprintf(file_out_protos,"\t\"array_vars3\": %i,\n",p.c4);
		fprintf(file_out_protos,"\t\"array_vars\": %i,\n",p.c5);
		fprintf(file_out_protos,"\t\"array_vars2\": %i,\n",p.c6);
		
		fprintf(file_out_protos,"\t\"color1\": %f,\n",ccc1);
		fprintf(file_out_protos,"\t\"color2\": %f,\n",ccc2);
		fprintf(file_out_protos,"\t\"color3\": %f,\n",ccc3);
		fprintf(file_out_protos,"\t\"color4\": %f,\n",ccc4);
		fprintf(file_out_protos,"\t\"color5\": %f,\n",ccc5);
		fprintf(file_out_protos,"\t\"color6\": %f,\n",ccc6);
		fprintf(file_out_protos,"\t\"color7\": %f,\n",ccc7);
		fprintf(file_out_protos,"\t\"color8\": %f,\n",ccc8);
		fprintf(file_out_protos,"\t\"color9\": %f,\n",ccc9);
		fprintf(file_out_protos,"\t\"color10\": %f,\n",ccc10);
		fprintf(file_out_protos,"\t\"color11\": %f,\n",ccc11);
		fprintf(file_out_protos,"\t\"color12\": %f,\n",ccc12);
		fprintf(file_out_protos,"\t\"color13\": %f,\n",ccc13);
		fprintf(file_out_protos,"\t\"color14\": %f,\n",ccc14);
		fprintf(file_out_protos,"\t\"color15\": %f,\n",ccc15);
		fprintf(file_out_protos,"\t\"color16\": %f,\n",ccc16);
		fprintf(file_out_protos,"\t\"color17\": %f,\n",ccc17);
		fprintf(file_out_protos,"\t\"color18\": %f,\n",ccc18);
		fprintf(file_out_protos,"\t\"color19\": %f,\n",ccc19);
		fprintf(file_out_protos,"\t\"color20\": %f\n",ccc20);
		
		//*/
		
		
		if (i<proto_obj_count-1)
			fprintf(file_out_protos,"},\n");
		else
			fprintf(file_out_protos,"}\n");
		
		/*ch
		z1
		b
		z2*/
		
		//break;
	}
	
	fprintf(file_out_protos,"], \"mobs\":[\n");
	
	// Mob Proto
	
	int mob_count = read_vint(binfile);
	
	printf("MOB COUNT: %i\n",mob_count);
	
	for (int i=0;i<mob_count;i++) {
		//16 bytes per!
		int i1 = read_vint(binfile);
		int i2 = read_vint(binfile);
		int i3 = read_char(binfile); //c
		char c1; //12
		char c2;
		//printf("> %i\n",d);
		if (((char)i3)<0) {
			i3 = read_int(binfile); //back to c
			c1 = read_char(binfile); //12
			c2 = read_char(binfile); //13
			i3 &= 0xFFFFFF7F;
		} else {
			i3>>=1;
			i3 &= 1;
			c1 = 2;
			c2 = i3;
		}
		fprintf(file_out_protos,"{\"obj\":%i,\"i2\":%i,\"i3\":%i,\"c1\":%i,\"c2\":%i}",i1,i2,i3,c1,c2);
		if (i<mob_count-1)
			fprintf(file_out_protos,",");
		fprintf(file_out_protos,"\n");
	}
	
	// String Proto
	
	fprintf(file_out_protos,"], \"strs\":[\n");
	
	int str_count = read_vint(binfile);
	
	int nnn = 0;
	
	printf("STR COUNT: %i\n",str_count);
	
	for (int i=0;i<str_count;i++) {
		fprintf(file_out_protos,"\"");
		//str1 size = 4?!?
		//str2 size = 20
		int len = 0;
		
		for (;;) {
			int x = ftell(binfile);
			short y = read_short(binfile);
			y ^= x;
			len += y;
			
			if (y!=0xFFFF) break;
		}
		
		//printf("# %i\n",len);
		
		int x = ftell(binfile);
		
		//printf("[[");
		
		for (int j=0;j<len;j++) {
			char c = read_char(binfile);
			c ^= x;
			x += 9;
			if (c=='"'||c=='\\') {
				fputc('\\',file_out_protos);
			}
			if (c<32 || c>126) {
				fprintf(file_out_protos,"\\u00%02hhx",c);
			} else {
				fputc(c,file_out_protos);
			}
			//printf("%c",c);
			nnn++;
		}
		nnn++;
		
		if (i<str_count-1)
			fprintf(file_out_protos,"\",\n");
		else
			fprintf(file_out_protos,"\"\n");
		
		//printf("]]\n");
		
		//int x = ftell(binfile);
		
		
		// ^= x
		
		//break;
		//str1[n] = abs pointer to str2[n]
	}
	//printf(":D %i\n",nnn);
	
	//this is used for validating the strings or something - skip it because validation is for pussies
	int unknown_str_related = read_int(binfile);
	
	fprintf(file_out_protos,"],\"arrays\":[\n");
	
	/*read_char(binfile);
	
	printf("<%i>\n",read_int(binfile));
	printf("<%i>\n",read_int(binfile));
	printf("<%i>\n",read_int(binfile));
	printf("<%i>\n",read_int(binfile));
	printf("<%i>\n",read_int(binfile));
	printf("<%i>\n",read_int(binfile));
	printf("<%i>\n",read_int(binfile));
	printf("<%i>\n",read_int(binfile));
	printf("<%i>\n",read_int(binfile));
	printf("<%i>\n",read_int(binfile));*/
	/*read_char(binfile);
	read_char(binfile);
	read_char(binfile);
	read_char(binfile);
	
	read_char(binfile);
	read_char(binfile);
	read_char(binfile);*/
	
	// Id Array Protos
	
	int array_count = read_vint(binfile);
	printf("ARRAY COUNT: %i\n",array_count);
	for (int i=0;i<array_count;i++) {
		fprintf(file_out_protos,"[");
		int len = read_short(binfile);
		//printf("(%i)[",len);
		//break;
		for (int j=0;j<len;j++) {
			int k = read_vint(binfile);
			fprintf(file_out_protos,"%i",k);
			if (j<len-1)
				fprintf(file_out_protos,",");
			//printf(" %i ",k);
		}
		
		if (i<array_count-1)
			fprintf(file_out_protos,"],\n");
		else
			fprintf(file_out_protos,"]\n");
		//printf("]\n");
	}
	
	fprintf(file_out_protos,"],\"procs\":[\n");
	
	//fclose(file_out_ids);
	
	// Proc Protos
	
	int proc_count = read_vint(binfile);
	printf("PROC COUNT: %i\n",proc_count);
	for (int i=0;i<proc_count;i++) {
		int ia = read_vint(binfile);
		int ib = read_vint(binfile);
		int ic = read_vint(binfile);
		int id = read_vint(binfile);
		
		
		char ca = read_char(binfile);
		char cb = read_char(binfile);
		char cc = read_char(binfile);
		
		int ja;
		int jb;
		
		if (cc>=0) {
			//green
			ja = cc;
			jb = 0;
			if (cc!=8) {
				cc >> 4;
				cc &= 1;
				jb = cc;
				if (cc==0) {
					jb = 0xFF;
				}
			}
		} else {
			//red
			int ja = read_int(binfile);
			int jb = read_char(binfile);
		}
		
		int ka = read_vint(binfile);//); //28
		int kb = read_vint(binfile);//); //32
		int kc = read_vint(binfile);//); //36
		
		fprintf(file_out_protos,"{\"str_path\":%i,\"str_name\":%i,\"ic\":%i,\"id\":%i,\"ca\":%i,\"cb\":%i,\"cc\":%i,\"ja\":%i,\"jb\":%i,\"code\":%i,\"vars\":%i,\"args\":%i}",ia,ib,ic,id,ca,cb,cc,ja,jb,ka,kb,kc);
		if (i<proc_count-1)
			fprintf(file_out_protos,",");
		fprintf(file_out_protos,"\n");
	}
	
	// M1 Protos
	
	fprintf(file_out_protos,"],\"keyvals\":[\n");
	
	int m1_count = read_vint(binfile);
	printf("KEYVAL COUNT: %i\n",m1_count);
	for (int i=0;i<m1_count;i++) {
		int a = read_char(binfile);
		int b = read_int(binfile);
		int c = read_vint(binfile);
		
		fprintf(file_out_protos,"[%i,%i,%i]",a,b,c);
		if (i<m1_count-1)
			fprintf(file_out_protos,",");
		fprintf(file_out_protos,"\n");
	}
	
	fprintf(file_out_protos,"],\"m2\":[\n");
	
	int m2_count = read_vint(binfile);
	printf("M2 COUNT: %i\n",m2_count);
	for (int i=0;i<m2_count;i++) {
		int a = read_vint(binfile);
		fprintf(file_out_protos,"%i",a);
		if (i<m2_count-1)
			fprintf(file_out_protos,",");
	}
	
	fprintf(file_out_protos,"],\"m3\":[\n");
	
	int m3_count = read_vint(binfile);
	printf("M3 COUNT: %i\n",m3_count);
	for (int i=0;i<m3_count;i++) {
		int a = read_char(binfile);
		int b = read_int(binfile);
		int c = read_vint(binfile);
		fprintf(file_out_protos,"[%i,%i,%i]",a,b,c);
		if (i<m3_count-1)
			fprintf(file_out_protos,",");
		fprintf(file_out_protos,"\n");
	}
	
	//fprintf(file_out_etc,"]]");
	
	//fclose(file_out_etc);
	
	fprintf(file_out_protos,"],\"f1\":[\n");
	
	//ftell(binfile);
	
	//malloc memory for protos! size is in bytes!
	
	// #1
	
	// read var sized int
	
	// 112 size
	
	// malloc count*112
	
	int f1_count = read_int(binfile);
	int c=0;
	for (int i=0;i<f1_count;i++) {
		c+=read_short(binfile);
		int v = read_vint(binfile);
		fprintf(file_out_protos,"{\n");
		fprintf(file_out_protos,"\"c\": %i,\n",c);
		fprintf(file_out_protos,"\"v\": %i\n",v);
		fprintf(file_out_protos,"}");
		if (i<f1_count-1)
			fprintf(file_out_protos,",");
		fprintf(file_out_protos,"\n");
	}
	
	fprintf(file_out_protos,"],\"world\":{\n");
	
	fprintf(file_out_protos,"\"a1\": %i,\n",read_vint(binfile));
	fprintf(file_out_protos,"\"a2\": %i,\n",read_vint(binfile));
	fprintf(file_out_protos,"\"a3\": %i,\n",read_vint(binfile));
	fprintf(file_out_protos,"\"a4\": %i,\n",read_vint(binfile));
	fprintf(file_out_protos,"\"proc_init\": %i,\n",read_vint(binfile));
	fprintf(file_out_protos,"\"a6\": %i,\n",read_vint(binfile));
	fprintf(file_out_protos,"\"str_name\": %i,\n",read_vint(binfile));
	
	fprintf(file_out_protos,"\"frame_ms\": %i,\n",read_int(binfile));
	fprintf(file_out_protos,"\"b2\": %i,\n",read_vint(binfile));
	fprintf(file_out_protos,"\"b3\": %i,\n",read_vint(binfile));
	
	fprintf(file_out_protos,"\"c1\": %i,\n",read_char(binfile));
	fprintf(file_out_protos,"\"c2\": %i,\n",read_char(binfile));
	fprintf(file_out_protos,"\"c3\": %i,\n",read_short(binfile));
	fprintf(file_out_protos,"\"c4\": %i,\n",read_char(binfile));
	fprintf(file_out_protos,"\"c5\": %i,\n",read_vint(binfile));
	
	int d_count = read_short(binfile);
	
	fprintf(file_out_protos,"\"d\": [");
	
	for (int i=0;i<d_count;i++) {
		if (i<d_count-1)
			fprintf(file_out_protos,"%i,",read_vint(binfile));
		else
			fprintf(file_out_protos,"%i",read_vint(binfile));
	}
	
	fprintf(file_out_protos,"],\n");
	
	//int tick = read_short(binfile);
	
	//float tock = *reinterpret_cast<float*>(&tick);
	
	int wtf = read_short(binfile);
	
	if (wtf==65535)
		wtf= -1;
	else if (wtf==13621)
		wtf= 0;
	else
		wtf= (wtf-257)/514;
	
	fprintf(file_out_protos,"\"view_dist\": %i,\n",wtf);
	
	fprintf(file_out_protos,"\"f1\": %i,\n",read_vint(binfile));
	fprintf(file_out_protos,"\"f2\": %i,\n",read_vint(binfile));
	fprintf(file_out_protos,"\"f3\": %i,\n",read_int(binfile));
	fprintf(file_out_protos,"\"f4\": %i,\n",read_int(binfile));
	fprintf(file_out_protos,"\"f5\": %i,\n",read_short(binfile));
	
	fprintf(file_out_protos,"\"g1\": %i,\n",read_vint(binfile));
	fprintf(file_out_protos,"\"g2\": %i,\n",read_vint(binfile));
	fprintf(file_out_protos,"\"g3\": %i,\n",read_vint(binfile));
	fprintf(file_out_protos,"\"g4\": %i,\n",read_vint(binfile));
	fprintf(file_out_protos,"\"g5\": %i,\n",read_vint(binfile));
	
	fprintf(file_out_protos,"\"icon_w\": %i,\n",read_short(binfile));
	fprintf(file_out_protos,"\"icon_h\": %i,\n",read_short(binfile));
	fprintf(file_out_protos,"\"h3\": %i\n",read_short(binfile));
	
	//fprintf(file_out_protos,"\"z1\": %i,\n",read_char(binfile));
	//fprintf(file_out_protos,"\"z2\": %i\n",read_char(binfile));
	
	fprintf(file_out_protos,"},\"rsc\":[\n");
	
	int rsc_count = read_vint(binfile);
	
	printf("RSC COUNT: %i \n",rsc_count);
	
	for (int i=0;i<rsc_count;i++) {
		if (i<rsc_count-1)
			fprintf(file_out_protos,"\"%i\",\n",read_int(binfile));
		else
			fprintf(file_out_protos,"\"%i\"\n",read_int(binfile));
		int a = read_char(binfile);
		//printf(">%i\n",a);
	}
	
	
	
	
	fprintf(file_out_protos,"]}");
	
	fclose(file_out_protos);
	
	//printf("*** %i\n",read_char(binfile));
	//printf("*** %i\n",read_char(binfile));
	//printf("*** %i\n",read_char(binfile));
	
	printf("@%i\n",ftell(binfile));
	
	
	fclose(binfile);
	
	return 0;
}