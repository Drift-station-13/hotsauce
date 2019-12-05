#include <cstdio>
#include <cstring>
#include <string>




unsigned char read_char(FILE* f) {
	char c = fgetc(f);
	return c;
}

unsigned short read_short(FILE* f) {
	unsigned short a = read_char(f);
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

#define FLAGS_1 0

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

int main(int argc,char** argv) {
	if (argc!=3) {
		printf("Bad args!\n");
		return 1;
	}


	char* fname_in = argv[1];
	char* fname_out_index = argv[2];

	// Open file
	
	FILE* rscfile = fopen(fname_in,"rb");
	
	if (!rscfile) {printf("Failed to open resource!\n"); return 1;}
	
	FILE* file_out_index = fopen(fname_out_index,"w");
	
	fprintf(file_out_index,"{");
	bool first = true;
	for (;;) {
		int stride = read_int(rscfile);
		bool not_fucked = read_char(rscfile);
		
		if (not_fucked) {
			
			
			char rsc_type = read_char(rscfile);
			int rsc_hash = read_int(rscfile);
			
			//printf("%i %i >> ",rsc_type,rsc_hash);
			// 0=html/css/js
			
			// 2=ogg/sound
			// 3=dmi/icon
			
			// 6=png/image
			
			for (int z=0;z<8;z++) {
				int c = read_char(rscfile);
				//printf("%i ",c);
			}
			//printf("-- ");
			//int n1 = read_int(rscfile);
			//int n2 = read_int(rscfile);
			//printf("%i %i ",n1,n2);
			
			
			int rsc_len = read_int(rscfile);
			
			if (feof(rscfile))
				break;
			
			
			if (first) {
				first=false;
				fprintf(file_out_index,"\n");
			} else
				fprintf(file_out_index,",\n");
			
			std::string rsc_name;
			for (;;) {
				char c = read_char(rscfile);
				if (c==0) break;
				
				if (c=='\\')
					rsc_name += '/';
				else
					rsc_name += c;
			}
			//printf("%s\n",rsc_name.c_str());
			
			stride -= rsc_name.length()+18;
		
			fprintf(file_out_index,"\"%i\": \"%s\"",rsc_hash,rsc_name.c_str());
		} else {
			//printf("[HOLE]\n");
		}
		
		for (int j=0;j<stride;j++) {
			read_char(rscfile);
		}
	}
	fprintf(file_out_index,"\n}");
	
	/*printf("\n\n\n\n\n\n\n\n\n");
	
	/*short f = read_short(rscfile);
	int a = read_int(rscfile);
	int b = read_int(rscfile);
	int c = read_int(rscfile);
	int d = read_int(rscfile);
	int rsc_len = read_int(rscfile);
	
	printf("\n\n\n\n\n\n\n\n\n");
	
	printf("%c",read_char(rscfile));
	printf("%c",read_char(rscfile));
	printf("%c",read_char(rscfile));
	printf("%c",read_char(rscfile));
	printf("%c",read_char(rscfile));
	printf("%c",read_char(rscfile));
	printf("%c",read_char(rscfile));
	printf("%c",read_char(rscfile));*/
	
	//printf("\n\n\n\n\n\n\n\n\n");
	
	return 0;
}