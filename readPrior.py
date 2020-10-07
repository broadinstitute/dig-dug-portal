filepath = 'prior_full.txt'
my_file = open(filepath, "r")
content = my_file.read()
content_list = content.splitlines()
print(content_list)
file = open('prior_new.txt',"w")
file.write(content.splitlines())
