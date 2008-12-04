.PHONY: all clean

SOURCE=../lib/Gettext.js

all: pod/Gettext.pod html/Gettext.html text/Gettext.text

pod/Gettext.pod: $(SOURCE) pod
	perldoc -u $< > $@

html/Gettext.html: pod/Gettext.pod html
	pod2html $< > $@
	rm pod2htm*.tmp

text/Gettext.text: pod/Gettext.pod text
	pod2text $< > $@

html text pod:
	mkdir -p $@

clean:
	rm -fr html text pod
